import { NextRequest, NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { readWeeklySheet, saveWeeklySheet, WeeklySheetError } from "@/lib/weeklySheet";

export const dynamic = "force-dynamic";
function failure(error: unknown) {
  const status = error instanceof WeeklySheetError ? error.status : 502;
  const message = error instanceof WeeklySheetError ? error.message : "Google Sheets belum dapat diakses. Periksa koneksi dan izin spreadsheet.";
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function GET() {
  const error = await adminRequestError();
  if (error) return error;
  try { return NextResponse.json(await readWeeklySheet(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function PUT(request: NextRequest) {
  const error = await adminRequestError(request);
  if (error) return error;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new WeeklySheetError("Formulir tidak valid.");
    if (typeof body.revision !== "string" || body.revision.length !== 64) throw new WeeklySheetError("Muat ulang formulir sebelum menyimpan.");
    try { return NextResponse.json(await saveWeeklySheet(body.values, body.revision), { headers: { "Cache-Control": "no-store" } }); }
    catch (error) {
      if (error instanceof WeeklySheetError) throw error;
      if (error instanceof Error && /tidak valid|Pilih tanggal|Nomor lagu/.test(error.message)) throw new WeeklySheetError(error.message);
      throw error;
    }
  } catch (error) {
    return failure(error instanceof SyntaxError ? new WeeklySheetError("Formulir tidak valid.") : error);
  }
}
