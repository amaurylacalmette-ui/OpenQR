import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "openqr_session";
const SESSION_DURATION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// ---------------------------------------------------------------------------
// Sessions (DB-backed, opaque tokens — only the SHA-256 hash is persisted)
// ---------------------------------------------------------------------------

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session for the user, sets the secure session cookie and
 * opportunistically removes this user's expired sessions.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await db.session.create({ data: { userId, tokenHash, expiresAt } });

  // Housekeeping: drop this user's expired sessions.
  await db.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

/**
 * Deletes the current session (DB row) and clears the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashSessionToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

/**
 * Resolves the authenticated user for the current request.
 * Wrapped in React `cache()` so multiple calls within one render pass
 * hit the database only once.
 */
export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      createdAt: session.user.createdAt,
    };
  }
);

/**
 * For server components / actions that require authentication.
 * Redirects to /login (with return URL) when unauthenticated.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
