"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  requireUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

function zodToState(error: {
  flatten: () => { formErrors: string[]; fieldErrors: Record<string, string[]> };
}): ActionState {
  const flattened = error.flatten();
  return {
    error: flattened.formErrors[0] ?? "Please fix the highlighted fields.",
    fieldErrors: flattened.fieldErrors,
  };
}

async function authIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

const AUTH_RATE_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rl = rateLimit(`auth:${await authIp()}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with this email already exists.",
      fieldErrors: { email: ["An account with this email already exists."] },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rl = rateLimit(`auth:${await authIp()}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Burn comparable time as a real hash check to resist user enumeration.
    await hashPassword(password);
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  await createSession(user.id);

  const next = formData.get("next");
  const target =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";
  redirect(target);
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Profile & password (settings)
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { name, email } = parsed.data;

  if (email !== user.email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return {
        error: "This email is already in use.",
        fieldErrors: { email: ["This email is already in use."] },
      };
    }
  }

  await db.user.update({ where: { id: user.id }, data: { name, email } });
  return { success: true };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const rl = rateLimit(`pwchange:${user.id}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Account not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return {
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Current password is incorrect."] },
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  // Rotate credentials → invalidate every existing session, then re-issue one
  // for the current device so the user is not unexpectedly logged out here.
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSession(user.id);

  return { success: true };
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await db.user.delete({ where: { id: user.id } }); // cascades to QR codes, scans, sessions
  await destroySession();
  redirect("/");
}
