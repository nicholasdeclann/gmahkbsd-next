import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, ADMIN_COOKIE, isAdminConfigured } from "@/lib/adminAuth";
import { isSameOrigin } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

// Best-effort per-process throttle. A platform rate limit is needed across Vercel instances.
const attempts = new Map<string, { count: number; expires: number }>();

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  if (!isAdminConfigured()) return NextResponse.json({ error: "Kata sandi dashboard belum diatur. Hubungi pengelola website." }, { status: 503 });
  const key = process.env.VERCEL ? req.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.expires <= now) attempts.delete(id);
  const entry = attempts.get(key) ?? { count: 0, expires: now + 60_000 };
  if (entry.count >= 10) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam satu menit." }, { status: 429, headers: { "Retry-After": "60" } });
  entry.count++;
  if (attempts.size < 1000 || attempts.has(key)) attempts.set(key, entry);
  let password = "";
  try {
    const body = await req.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    // ignore malformed body
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  attempts.delete(key);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, createSessionToken(), ADMIN_COOKIE);
  return res;
}
