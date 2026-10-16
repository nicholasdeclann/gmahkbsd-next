import { NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { getSheetSettings, saveSheetSettings } from "@/lib/sheetSettings";
import { previewSheetSources } from "@/lib/previewSheetSources";
import { sheetLink } from "@/lib/sheetSources";

export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
function failure(error: unknown) { return json({ error: error instanceof Error && /^(Tempel|Gunakan|Tab |Buka|Bagikan|Spreadsheet|Tanggal|Jadwal|Koneksi|Konfigurasi|Pengaturan|Sumber|Muat|Belum|Google Sheets belum)/.test(error.message) ? error.message : "Google belum dapat diakses. Periksa koneksi dan izin spreadsheet." }, 400); }
export async function GET() {
  const denied = await adminRequestError(); if (denied) return denied;
  try {
    let serviceEmail: string | undefined;
    try { serviceEmail = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "{}").client_email; } catch { /* Credential errors are reported during preview. */ }
    return json({ ...await getSheetSettings(), serviceEmail });
  } catch { return json({ error: "Pengaturan belum dapat dibaca dari Google Drive. Coba lagi." }, 503); }
}
export async function POST(request: Request) {
  const denied = await adminRequestError(request); if (denied) return denied;
  if (Number(request.headers.get("content-length")) > 6000) return json({ error: "Tautan terlalu panjang." }, 400);
  try { const body = await request.json(); return json(await previewSheetSources(body.mainLink, body.participantLink)); } catch (error) { return failure(error); }
}
export async function PUT(request: Request) {
  const denied = await adminRequestError(request); if (denied) return denied;
  if (Number(request.headers.get("content-length")) > 6000) return json({ error: "Tautan terlalu panjang." }, 400);
  try {
    const body = await request.json();
    if (typeof body.revision !== "string" || body.revision.length !== 64) throw new Error("Muat ulang pengaturan sebelum menyimpan.");
    const current = await getSheetSettings();
    const previous = body.restore ? current.previous : undefined;
    if (body.restore && !previous) throw new Error("Belum ada pengaturan sebelumnya.");
    // Recheck links and permissions at save time; never trust preview data from the browser.
    const preview = await previewSheetSources(previous ? sheetLink(previous.liturgy.sheetId, previous.liturgy.kertasAcaraGid) : body.mainLink,
      previous ? sheetLink(previous.schedule.sheetId, previous.schedule.gid) : body.participantLink);
    return json(await saveSheetSettings(preview.sources, body.revision));
  } catch (error) { return failure(error); }
}
