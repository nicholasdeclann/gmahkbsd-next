import { NextResponse } from "next/server";
import { readPrayerSheet, savePrayerSheet, PrayerSheetError } from "@/lib/prayerSheet";
import { isAuthenticated } from "@/lib/adminAuth";
import { adminRequestError } from "@/lib/adminRequest";
export const dynamic = "force-dynamic";
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof PrayerSheetError ? error.message : "Daftar doa belum berhasil dimuat atau disimpan. Coba lagi; isian Anda tetap tersedia." },
    { status: error instanceof PrayerSheetError ? error.status : 502 });
}
export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });
  try { return NextResponse.json(await readPrayerSheet(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  const authError = await adminRequestError(request); if (authError) return authError;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Formulir tidak valid." }, { status: 400 }); }
  if (!body || typeof body.revision !== "string" || !/^[a-f0-9]{64}$/.test(body.revision)) return NextResponse.json({ error: "Muat ulang data sebelum menyimpan." }, { status: 400 });
  try { return NextResponse.json(await savePrayerSheet(body.slots, body.revision)); }
  catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  const authError = await adminRequestError(request); if (authError) return authError;
  return NextResponse.json({ error: "Gunakan empat slot pada dashboard untuk mengganti atau mengosongkan nama." }, { status: 409 });
}
