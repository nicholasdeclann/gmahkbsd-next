import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminAuth";
import { isSameOrigin } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, "", {
    ...ADMIN_COOKIE,
    maxAge: 0,
  });
  return res;
}
