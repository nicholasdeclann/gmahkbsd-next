import { createHash } from "node:crypto";
import { getSheetSettings } from "./sheetSettings";
import type { SheetSources } from "./sheetSources";
import { isWeeklyDemo, readDemo, updateDemo, type DemoData } from "./localDemo";
import { sheetsClient } from "./weeklySheet";
import { churchWeekStart, serialToDate } from "./kertasAcaraForm";
import { emptyPrayerSlots, nameFromPrayerCell, prayerUpdateRequests, validatePrayerSlots, type PrayerSlot, type PrayerSnapshot } from "./prayerTypes";

export class PrayerSheetError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
const revision = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function demoSnapshot(data: DemoData): PrayerSnapshot {
  const slots = data.prayerSlots ?? emptyPrayerSlots().map((slot, index) => {
    const old = data.prayers[index]; return old ? { name: old.name, note: old.note ?? "", note_public: old.note_public } : slot;
  });
  const date = data.weekly.date;
  const displayed = slots.map(slot => ({ name: slot.name, note: "", note_public: false }));
  return { slots: displayed, date, revision: revision({ date, slots: displayed }), mode: "demo", canWrite: true, notesConfigured: false };
}

async function readSheetNames(source?: SheetSources) {
  const sources = source ?? (await getSheetSettings()).sources;
  const result = await sheetsClient().spreadsheets.get({ spreadsheetId: sources.liturgy.sheetId,
    ranges: ["'Kertas Acara'!B50:B53", "'Kertas Acara'!C2"], includeGridData: true,
    fields: "sheets(properties(sheetId),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue))))" });
  const sheet = result.data.sheets?.find(s => String(s.properties?.sheetId) === sources.liturgy.kertasAcaraGid);
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

async function googleSnapshot(source?: SheetSources) {
  const sources = source ?? (await getSheetSettings()).sources;
  const sheet = await readSheetNames(sources);
  return { sheet, snapshot: { slots: sheet.names.map(name => ({ name, note: "", note_public: false })), date: sheet.date,
    revision: revision({ sheet, sources }), mode: "google" as const,
    canWrite: process.env.GOOGLE_SHEETS_WRITES_ENABLED === "true" && !sheet.hasFormula,
    notesConfigured: false } };
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
  const sources = (await getSheetSettings()).sources;
  const { sheet, snapshot } = await googleSnapshot(sources);
  if (!snapshot.canWrite) throw new PrayerSheetError("Penyimpanan belum diaktifkan atau sel nama berisi rumus. Hubungi pengelola website.");
  if (snapshot.revision !== expectedRevision) throw new PrayerSheetError("Spreadsheet sudah diubah. Muat ulang sebelum menyimpan.", 409);
  const requests = prayerUpdateRequests(slots, Number(sources.liturgy.kertasAcaraGid));
  await sheetsClient().spreadsheets.batchUpdate({ spreadsheetId: sources.liturgy.sheetId, requestBody: { requests } });
  const saved = await readPrayerSheet();
  if (saved.date !== sheet.date || JSON.stringify(saved.slots) !== JSON.stringify(slots)) throw new PrayerSheetError("Hasil penyimpanan belum sesuai. Muat ulang untuk memeriksa nama.", 409);
  return saved;
}

export async function publicPrayerItems(now = new Date()) {
  const snapshot = await readPrayerSheet();
  const service = new Date(`${snapshot.date}T12:00:00+07:00`);
  if (Number.isNaN(service.getTime()) || churchWeekStart(service) !== churchWeekStart(now)) return [];
  return snapshot.slots.flatMap((slot, index) => slot.name ? [{ id: index + 1, name: slot.name, note: null }] : []);
}
