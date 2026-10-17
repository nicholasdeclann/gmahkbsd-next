import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminAuth";
import { isSameOrigin } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  for (const name of ["canva_credentials", "canva_oauth_state", "canva_oauth_verifier"]) res.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(ADMIN_COOKIE.name, "", {
    ...ADMIN_COOKIE,
    maxAge: 0,
  });
  return res;
}
