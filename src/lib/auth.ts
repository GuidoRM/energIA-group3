import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env, isProduction } from "@/config/env";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/lib/types";

/**
 * Auth mínima (§2, RNF): JWT en cookie httpOnly + bcrypt.
 * Toda la lógica de sesión vive acá; los handlers solo llaman a estas funciones.
 */

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días
const secret = new TextEncoder().encode(env.JWT_SECRET);

// ── Password hashing ──────────────────────────────────────────────────────
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ────────────────────────────────────────────────────────────────────
export async function signSession(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: String(payload.userId),
      organizationId: String(payload.organizationId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "admin" ? "admin" : "member",
    };
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Resuelve el usuario de la request (o null si no hay sesión válida). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Igual que getSession pero lanza 401 si no hay sesión (RF1.4). */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw AppError.unauthorized();
  return session;
}
