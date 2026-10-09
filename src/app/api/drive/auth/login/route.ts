import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, DRIVE_STATE_COOKIE, driveOAuthConfigured } from "@/lib/drive";
import { adminRequestError } from "@/lib/adminRequest";
import { randomBytes } from "node:crypto";
import { isLocalDemo } from "@/lib/localDemo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const error = await adminRequestError(request);
  if (error) return error;
  if (isLocalDemo() || !driveOAuthConfigured()) return NextResponse.json({ error: "Koneksi Google Drive belum dikonfigurasi." }, { status: 503 });
  const state = randomBytes(32).toString("hex");
  const res = NextResponse.json({ authUrl: getAuthUrl(state) }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(DRIVE_STATE_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
