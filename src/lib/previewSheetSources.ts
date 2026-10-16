import "server-only";
import { google } from "googleapis";
import { sheetsClient } from "./weeklySheet";
import { parseSheetLink, type SheetSources } from "./sheetSources";
import { parseQuarterlySchedule, sheetDate } from "./quarterlySchedule";

export interface SourcePreview { sources: SheetSources; workbook: string; participants: string; tabs: string[]; dates: string[]; quarterDates: string[]; warnings: string[] }
async function publicGrid(sheetId: string, gid: string, range: string) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.search = new URLSearchParams({ gid, range, headers: "0", tqx: "out:json" }).toString();
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Spreadsheet belum dapat dibaca oleh pengunjung. Periksa akses tautan.");
  const text = await response.text();
  try { const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); if (json.status === "error" || !json.table?.rows) throw new Error(); return { text, json }; }
  catch { throw new Error("Spreadsheet belum dapat dibaca oleh pengunjung. Periksa akses tautan."); }
}
export async function previewSheetSources(mainLink: unknown, participantLink: unknown): Promise<SourcePreview> {
  const main = parseSheetLink(mainLink), participants = parseSheetLink(participantLink);
  const api = sheetsClient();
  const [workbook, schedule] = await Promise.all([main.sheetId, participants.sheetId].map(spreadsheetId => api.spreadsheets.get({ spreadsheetId, fields: "properties(title),sheets(properties(sheetId,title))" }, { timeout: 12000 })));
  const tabs = workbook.data.sheets?.map(sheet => sheet.properties!) ?? [];
  const required = ["Kertas Acara", "Lagu Sion", "Jadwal Kuartal"];
  const ids = required.map(name => {
    const tab = tabs.find(t => t.title === name);
    if (!tab || tab.sheetId === null || tab.sheetId === undefined) throw new Error(`Tab “${name}” tidak ditemukan. Gunakan workbook dengan susunan yang sama.`);
    return String(tab.sheetId);
  });
  const participantTab = schedule.data.sheets?.find(s => participants.gid !== null ? String(s.properties?.sheetId) === participants.gid : s.properties?.title === "Khotbah & SS")?.properties;
  if (participantTab?.sheetId === undefined || participantTab.sheetId === null) throw new Error("Buka tab peserta Khotbah & SS, lalu salin tautannya beserta gid.");
  const sources: SheetSources = { liturgy: { sheetId: main.sheetId, kertasAcaraGid: ids[0], laguSionGid: ids[1], quarterlyScheduleGid: ids[2] }, schedule: { sheetId: participants.sheetId, gid: String(participantTab.sheetId) } };
  // Read-only permission check: preview never writes test values into church cells.
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  const drive = google.drive({ version: "v3", auth });
  const permission = await drive.files.get({ fileId: main.sheetId, fields: "capabilities(canEdit)" }, { timeout: 12000 });
  if (!permission.data.capabilities?.canEdit) throw new Error(`Bagikan workbook kepada ${credentials.client_email} sebagai Editor agar formulir Kertas Acara dan Pokok Doa tetap dapat disimpan.`);
  const [quarter, participantGrid] = await Promise.all([publicGrid(main.sheetId, ids[2], "B4:CZ33"), publicGrid(participants.sheetId, String(participantTab.sheetId), "A1:P5"), publicGrid(main.sheetId, ids[0], "B2:J7"), publicGrid(main.sheetId, ids[1], "B2:C5")]);
  const parsed = parseQuarterlySchedule(quarter.text);
  const participantRows = participantGrid.json.table.rows as { c?: ({v?: string | number; f?: string} | null)[] }[];
  const header = participantRows.flatMap(row => row.c ?? []).map(cell => String(cell?.v ?? "")).join(" ");
  const year = /TAHUN\s+(20\d{2})/i.exec(header)?.[1];
  const dates = participantRows.flatMap(row => (row.c ?? []).flatMap(cell => {
    const raw = String(cell?.v ?? "");
    const date = sheetDate(cell) ?? (year && /^\d{1,2}\s+[a-z]{3}$/i.test(raw) ? sheetDate({v:`${raw} ${year}`}) : null);
    return date && /^20\d{2}-/.test(date) ? [date] : [];
  }));
  if (!dates.length) throw new Error("Tanggal pelayanan tidak ditemukan pada bagian atas tab peserta. Periksa tab yang dipilih.");
  return { sources, workbook: workbook.data.properties?.title ?? "Workbook", participants: `${schedule.data.properties?.title} · ${participantTab.title}`, tabs: required, dates: [...new Set(dates)], quarterDates: parsed.dates,
    warnings: parsed.missingDates.length ? ["Jadwal Kuartal belum mencakup seluruh Sabat triwulan saat ini. Jika ini persiapan tahun berikutnya, periksa kembali tanggal yang ditampilkan."] : [] };
}
