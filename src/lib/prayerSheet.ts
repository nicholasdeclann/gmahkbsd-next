import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { churchConfig } from "@/config/church";
import { isWeeklyDemo, readDemo, updateDemo, type DemoData } from "./localDemo";
import { sheetsClient } from "./weeklySheet";
import { churchWeekStart, serialToDate } from "./kertasAcaraForm";
import { attachPrayerNotes, emptyPrayerSlots, nameFromPrayerCell, prayerUpdateRequests, validatePrayerSlots, type PrayerSlot, type PrayerSnapshot } from "./prayerTypes";

export class PrayerSheetError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
interface Notes { version: 1; date: string; slots: PrayerSlot[] }
const emptyNotes = (): Notes => ({ version: 1, date: "", slots: emptyPrayerSlots() });
const revision = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function notesDrive() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new PrayerSheetError("Koneksi Google belum diatur. Hubungi pengelola website.");
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ["https://www.googleapis.com/auth/drive"] });
  return google.drive({ version: "v3", auth });
}

async function readNotes(): Promise<Notes> {
  const id = process.env.GOOGLE_PRAYER_NOTES_FILE_ID;
  if (!id) return emptyNotes();
  const drive = notesDrive();
  const metadata = (await drive.files.get({ fileId: id, fields: "mimeType,size,trashed,properties,permissions(type,role,emailAddress)" })).data;
  if (metadata.trashed || metadata.mimeType !== "application/json" || Number(metadata.size) > 40000 || metadata.properties?.kind !== "gmahkbsd-prayer-notes"
    || !metadata.permissions?.length || metadata.permissions.some(p => p.type !== "user")) {
    throw new PrayerSheetError("Penyimpanan alasan doa harus berupa file pribadi. Hubungi pengelola website.");
  }
  const raw = await drive.files.get({ fileId: id, alt: "media" }, { responseType: "text" });
  const data = JSON.parse(String(raw.data)) as Notes;
  if (data.version !== 1 || typeof data.date !== "string") throw new PrayerSheetError("Data alasan doa perlu diperiksa oleh pengelola website.");
  try { return { version: 1, date: data.date, slots: validatePrayerSlots(data.slots) }; }
  catch { throw new PrayerSheetError("Data alasan doa perlu diperiksa oleh pengelola website."); }
}

function demoSnapshot(data: DemoData): PrayerSnapshot {
  const slots = data.prayerSlots ?? emptyPrayerSlots().map((slot, index) => {
    const old = data.prayers[index]; return old ? { name: old.name, note: old.note ?? "", note_public: old.note_public } : slot;
  });
  const date = data.weekly.date;
  const displayed = attachPrayerNotes(slots.map(s => s.name), date, { date: data.prayerDate ?? date, slots });
  return { slots: displayed, date, revision: revision({ date, slots }), mode: "demo", canWrite: true, notesConfigured: true };
}

async function readSheetNames() {
  const result = await sheetsClient().spreadsheets.get({ spreadsheetId: churchConfig.sheets.liturgy.sheetId,
    ranges: ["'Kertas Acara'!B50:B53", "'Kertas Acara'!C2"], includeGridData: true,
    fields: "sheets(properties(sheetId),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue))))" });
  const sheet = result.data.sheets?.find(s => String(s.properties?.sheetId) === churchConfig.sheets.liturgy.kertasAcaraGid);
  if (!sheet) throw new PrayerSheetError("Tab Kertas Acara tidak sesuai konfigurasi.");
  const names = ["", "", "", ""]; let date = ""; let hasFormula = false;
  for (const block of sheet.data ?? []) {
    (block.rowData ?? []).forEach((row, offset) => {
      const rowIndex = (block.startRow ?? 0) + offset;
      const cell = row.values?.[0];
      if (block.startColumn === 1 && rowIndex >= 49 && rowIndex <= 52) {
        hasFormula ||= Boolean(cell?.userEnteredValue?.formulaValue);
        names[rowIndex - 49] = nameFromPrayerCell(String(cell?.effectiveValue?.stringValue ?? cell?.effectiveValue?.numberValue ?? ""));
      }
      if (block.startColumn === 2 && rowIndex === 1) {
        const value = cell?.effectiveValue;
        date = typeof value?.numberValue === "number" ? serialToDate(value.numberValue) : value?.stringValue ?? "";
      }
    });
  }
  return { names, date, hasFormula };
}

async function googleSnapshot() {
  const [sheet, notes] = await Promise.all([readSheetNames(), readNotes()]);
  return { sheet, notes, snapshot: { slots: attachPrayerNotes(sheet.names, sheet.date, notes), date: sheet.date,
    revision: revision({ sheet, notes }), mode: "google" as const,
    canWrite: process.env.GOOGLE_SHEETS_WRITES_ENABLED === "true" && !sheet.hasFormula,
    notesConfigured: Boolean(process.env.GOOGLE_PRAYER_NOTES_FILE_ID) } };
}

export async function readPrayerSheet(): Promise<PrayerSnapshot> {
  if (isWeeklyDemo()) return demoSnapshot(await readDemo());
  return (await googleSnapshot()).snapshot;
}

export async function savePrayerSheet(input: unknown, expectedRevision: string): Promise<PrayerSnapshot> {
  let slots: PrayerSlot[];
  try { slots = validatePrayerSlots(input); } catch (error) { throw new PrayerSheetError((error as Error).message, 400); }
  if (isWeeklyDemo()) return updateDemo(data => {
    if (demoSnapshot(data).revision !== expectedRevision) throw new PrayerSheetError("Data sudah diubah. Muat ulang sebelum menyimpan.", 409);
    data.prayerSlots = slots; data.prayerDate = data.weekly.date; return demoSnapshot(data);
  });
  const { sheet, notes, snapshot } = await googleSnapshot();
  if (!snapshot.canWrite) throw new PrayerSheetError("Penyimpanan belum diaktifkan atau sel nama berisi rumus. Hubungi pengelola website.");
  if (snapshot.revision !== expectedRevision) throw new PrayerSheetError("Spreadsheet atau alasan doa sudah diubah. Muat ulang sebelum menyimpan.", 409);
  if (!snapshot.notesConfigured && slots.some(s => s.note)) throw new PrayerSheetError("Penyimpanan alasan doa belum diatur. Nama tetap dapat disimpan tanpa alasan.");
  const nextNotes: Notes = { version: 1, date: sheet.date, slots };
  // Save reasons first. If the sheet write fails, name/date binding prevents wrong reasons appearing.
  if (snapshot.notesConfigured && revision(notes) !== revision(nextNotes)) {
    await notesDrive().files.update({ fileId: process.env.GOOGLE_PRAYER_NOTES_FILE_ID!,
      media: { mimeType: "application/json", body: Readable.from([JSON.stringify(nextNotes)]) } });
  }
  const requests = prayerUpdateRequests(slots, Number(churchConfig.sheets.liturgy.kertasAcaraGid));
  await sheetsClient().spreadsheets.batchUpdate({ spreadsheetId: churchConfig.sheets.liturgy.sheetId, requestBody: { requests } });
  const saved = await readPrayerSheet();
  if (saved.date !== sheet.date || JSON.stringify(saved.slots) !== JSON.stringify(slots)) throw new PrayerSheetError("Hasil penyimpanan belum sesuai. Muat ulang untuk memeriksa nama dan alasan doa.", 409);
  return saved;
}

export async function publicPrayerItems(now = new Date()) {
  let snapshot: PrayerSnapshot;
  try { snapshot = await readPrayerSheet(); }
  catch {
    // A notes-file outage must never expose private reasons or hide readable sheet names.
    if (isWeeklyDemo()) throw new PrayerSheetError("Daftar doa belum dapat dimuat.");
    const sheet = await readSheetNames();
    snapshot = { slots: sheet.names.map(name => ({ name, note: "", note_public: false })), date: sheet.date,
      revision: "", mode: "google", canWrite: false, notesConfigured: false };
  }
  const service = new Date(`${snapshot.date}T12:00:00+07:00`);
  if (Number.isNaN(service.getTime()) || churchWeekStart(service) !== churchWeekStart(now)) return [];
  return snapshot.slots.flatMap((slot, index) => slot.name ? [{ id: index + 1, name: slot.name, note: slot.note_public ? slot.note || null : null }] : []);
}
