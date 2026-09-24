"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateShortCode, isScannableColorPair } from "@/lib/qr";
import {
  createQrCodeSchema,
  updateQrCodeSchema,
  qrCustomizationSchema,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/actions/auth";

function zodToState(error: {
  flatten: () => { formErrors: string[]; fieldErrors: Record<string, string[]> };
}): ActionState {
  const flattened = error.flatten();
  return {
    error: flattened.formErrors[0] ?? "Please fix the highlighted fields.",
    fieldErrors: flattened.fieldErrors,
  };
}

const CREATE_RATE_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 };

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createQrCodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const rl = rateLimit(`create-qr:${user.id}`, CREATE_RATE_LIMIT.limit, CREATE_RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return { error: "Creation limit reached. Please try again later." };
  }

  const parsed = createQrCodeSchema.safeParse({
    name: formData.get("name"),
    destinationUrl: formData.get("destinationUrl"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { name, destinationUrl, description } = parsed.data;

  // Retry on the (astronomically unlikely) short-code collision.
  let qrCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    try {
      qrCode = await db.qRCode.create({
        data: {
          userId: user.id,
          name,
          destinationUrl,
          description: description || null,
          shortCode,
        },
      });
      break;
    } catch (err) {
      const isUniqueViolation =
        err instanceof Object &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (!isUniqueViolation || attempt === 4) throw err;
    }
  }

  if (!qrCode) return { error: "Could not create the QR code. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
  redirect(`/dashboard/qr-codes/${qrCode.id}?created=1`);
}

// ---------------------------------------------------------------------------
// Update (name / destination / description / active) — short code never changes
// ---------------------------------------------------------------------------

export async function updateQrCodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing QR code id." };

  const existing = await db.qRCode.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "QR code not found." };

  const parsed = updateQrCodeSchema.safeParse({
    name: formData.get("name"),
    destinationUrl: formData.get("destinationUrl"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") === null ? undefined : formData.get("isActive") === "on",
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { name, destinationUrl, description, isActive } = parsed.data;

  await db.qRCode.update({
    where: { id: existing.id },
    data: {
      name,
      destinationUrl,
      description: description || null,
      ...(isActive === undefined ? {} : { isActive }),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
  revalidatePath(`/dashboard/qr-codes/${id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Toggle active state
// ---------------------------------------------------------------------------

export async function toggleQrCodeAction(id: string): Promise<void> {
  const user = await requireUser();

  const existing = await db.qRCode.findFirst({ where: { id, userId: user.id } });
  if (!existing) return;

  await db.qRCode.update({
    where: { id: existing.id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
  revalidatePath(`/dashboard/qr-codes/${id}`);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteQrCodeAction(id: string): Promise<void> {
  const user = await requireUser();

  await db.qRCode.deleteMany({ where: { id, userId: user.id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
  redirect("/dashboard/qr-codes?deleted=1");
}

// ---------------------------------------------------------------------------
// Customization (colors / size / ECC)
// ---------------------------------------------------------------------------

export async function updateQrCustomizationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing QR code id." };

  const existing = await db.qRCode.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "QR code not found." };

  const parsed = qrCustomizationSchema.safeParse({
    foregroundColor: formData.get("foregroundColor"),
    backgroundColor: formData.get("backgroundColor"),
    size: Number(formData.get("size")),
    errorCorrection: formData.get("errorCorrection"),
  });
  if (!parsed.success) return zodToState(parsed.error);

  const { foregroundColor, backgroundColor, size, errorCorrection } = parsed.data;

  // Technical scannability guard — reject inverted / too-light pairs.
  if (!isScannableColorPair(foregroundColor, backgroundColor)) {
    return {
      error:
        "The foreground color must be clearly darker than the background, otherwise scanners cannot read the code.",
    };
  }

  await db.qRCode.update({
    where: { id: existing.id },
    data: { foregroundColor, backgroundColor, size, errorCorrection },
  });

  revalidatePath(`/dashboard/qr-codes/${id}`);
  return { success: true };
}
