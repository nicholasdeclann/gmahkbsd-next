import { NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
export const dynamic = "force-dynamic";
async function retired(request: Request) {
  const authError = await adminRequestError(request); if (authError) return authError;
  return NextResponse.json({ error: "Daftar doa kini menggunakan empat slot. Buka kembali halaman Pokok Doa pada dashboard." }, { status: 409 });
}
export const PUT = retired;
export const DELETE = retired;
