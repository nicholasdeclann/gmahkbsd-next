import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const value = process.env.ADMIN_SECRET ?? "";
  return value.length >= 32 ? value : "";
}

export function isAdminConfigured(): boolean {
  return Boolean(secret() && process.env.ADMIN_PASSWORD);
}

function signature(issuedAt: string): string {
  return createHmac("sha256", secret()).update(`${issuedAt}:${process.env.ADMIN_PASSWORD ?? ""}`).digest("hex");
}

/** Create a signed session token: "<issuedAt>.<hmac>". */
export function createSessionToken(): string {
  if (!isAdminConfigured()) throw new Error("Admin authentication is not configured");
  const issuedAt = String(Date.now());
  const sig = signature(issuedAt);
  return `${issuedAt}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token || !isAdminConfigured()) return false;
  const [issuedAt, sig, extra] = token.split(".");
  if (!issuedAt || !sig || extra !== undefined || !/^\d+$/.test(issuedAt) || !/^[a-f0-9]{64}$/.test(sig)) return false;

  const expected = signature(issuedAt);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  const age = (Date.now() - Number(issuedAt)) / 1000;
  return age >= 0 && age < MAX_AGE_SECONDS;
}

/** Check the incoming request's cookie for a valid admin session. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/** Validate a submitted password against the configured admin password. */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ADMIN_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
