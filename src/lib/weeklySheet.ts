import { createHash } from "node:crypto";
import { google } from "googleapis";
import { getSheetSettings } from "./sheetSettings";
import type { SheetSources } from "./sheetSources";
import { isWeeklyDemo, readDemo, updateDemo } from "./localDemo";
import { dateToSerial, serialToDate, validateWeeklyValues, WEEKLY_FIELDS, type WeeklySnapshot, type WeeklyValues } from "./kertasAcaraForm";

export class WeeklySheetError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function revision(values: WeeklyValues): string {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

export function sheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new WeeklySheetError("Koneksi Google Sheets belum diatur. Hubungi pengelola website.", 503);
  try {
    const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    return google.sheets({ version: "v4", auth });
  } catch { throw new WeeklySheetError("Konfigurasi Google Sheets tidak valid. Hubungi pengelola website.", 503); }
}

function demoSnapshot(values: WeeklyValues): WeeklySnapshot {
  return {
    values, revision: revision(values), mode: "demo", canWrite: true,
    dates: Array.from({ length: 52 }, (_, i) => serialToDate(dateToSerial("2026-01-03") + i * 7)),
    hymns: [{ number: "79", title: "Ku Puji Tuhan Yang Ciptakan" }, { number: "186", title: "Lagu Sion 186" },
      { number: "22", title: "Hai Jiwaku Bangun Seg'ra" }, { number: "68", title: "Bapa Kami Datang" },
      { number: "417", title: "`Bak Wanita Di Sumur" }, { number: "421", title: "Ada Tempat Diam Teduh" },
      { number: "168", title: "Kita Memiliki Pengharapan" }],
  };
}

export async function readWeeklySheet(source?: SheetSources): Promise<WeeklySnapshot> {
  if (isWeeklyDemo()) return demoSnapshot((await readDemo()).weekly);
  const sources = source ?? (await getSheetSettings()).sources;
  const sheets = sheetsClient();
  const result = await sheets.spreadsheets.get({
    spreadsheetId: sources.liturgy.sheetId,
    ranges: ["'Kertas Acara'!C2:C7", "'Kertas Acara'!J6:J7", "'Kertas Acara'!U81:U185", "'Lagu Sion'!B2:C526"],
    includeGridData: true,
    fields: "sheets(properties(sheetId,title),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue))))",
  });
  const sheet = result.data.sheets?.find(item => String(item.properties?.sheetId) === sources.liturgy.kertasAcaraGid);
  if (!sheet) throw new WeeklySheetError("Tab Kertas Acara tidak sesuai konfigurasi.", 503);
  const cells = new Map<string, string | number>();
  for (const block of sheet.data ?? []) {
    (block.rowData ?? []).forEach((row, offset) => {
      (row.values ?? []).forEach((cell, column) => {
        const rowIndex = (block.startRow ?? 0) + offset;
        const colIndex = (block.startColumn ?? 0) + column;
        if ([2, 9].includes(colIndex) && rowIndex <= 6 && cell.userEnteredValue?.formulaValue) {
          throw new WeeklySheetError("Sel masukan berisi rumus. Periksa spreadsheet sebelum mengedit.", 409);
        }
        cells.set(`${rowIndex}:${colIndex}`, cell.effectiveValue?.numberValue ?? cell.effectiveValue?.stringValue ?? "");
      });
    });
  }
  const values = {} as WeeklyValues;
  WEEKLY_FIELDS.forEach(field => {
    const row = Number(field.cell.slice(1)) - 1;
    const col = field.cell.startsWith("C") ? 2 : 9;
    const raw = cells.get(`${row}:${col}`) ?? "";
    values[field.key] = field.key === "date" && typeof raw === "number" ? serialToDate(raw) : String(raw);
  });
  const dates = Array.from({ length: 105 }, (_, i) => cells.get(`${80 + i}:20`))
    .filter((value): value is number => typeof value === "number").map(serialToDate);
  const hymns = (result.data.sheets?.find(item => String(item.properties?.sheetId) === sources.liturgy.laguSionGid)?.data?.[0]?.rowData ?? [])
    .map(row => ({ number: String(row.values?.[0]?.effectiveValue?.numberValue ?? row.values?.[0]?.effectiveValue?.stringValue ?? ""),
      title: String(row.values?.[1]?.effectiveValue?.stringValue ?? "") })).filter(hymn => hymn.number && hymn.title);
  return { values, dates: [...new Set(dates)], hymns, revision: createHash("sha256").update(JSON.stringify({ values, sources })).digest("hex"), mode: "google", canWrite: process.env.GOOGLE_SHEETS_WRITES_ENABLED === "true" };
}

export async function saveWeeklySheet(input: unknown, expectedRevision: string): Promise<WeeklySnapshot> {
  if (isWeeklyDemo()) {
    return updateDemo(data => {
      const current = demoSnapshot(data.weekly);
      if (current.revision !== expectedRevision) throw new WeeklySheetError("Data sudah diubah. Muat ulang sebelum menyimpan.", 409);
      data.weekly = validateWeeklyValues(input, current);
      return demoSnapshot(data.weekly);
    });
  }
  if (process.env.GOOGLE_SHEETS_WRITES_ENABLED !== "true") throw new WeeklySheetError("Penyimpanan ke Google Sheets belum diaktifkan.", 503);
  const sources = (await getSheetSettings()).sources;
  const current = await readWeeklySheet(sources);
  if (current.revision !== expectedRevision) throw new WeeklySheetError("Spreadsheet sudah diubah. Muat ulang sebelum menyimpan.", 409);
  const values = validateWeeklyValues(input, current);
  if (WEEKLY_FIELDS.every(field => current.values[field.key] === values[field.key])) return current;
  await sheetsClient().spreadsheets.batchUpdate({
    spreadsheetId: sources.liturgy.sheetId,
    requestBody: { requests: WEEKLY_FIELDS.filter(field => current.values[field.key] !== values[field.key]).map(field => {
      const row = Number(field.cell.slice(1)) - 1;
      const column = field.cell.startsWith("C") ? 2 : 9;
      const text = values[field.key];
      const userEnteredValue = field.key === "date" ? { numberValue: dateToSerial(text) }
        : field.key.endsWith("Hymn") && text ? { numberValue: Number(text) } : { stringValue: text };
      return { updateCells: { range: { sheetId: Number(sources.liturgy.kertasAcaraGid), startRowIndex: row,
        endRowIndex: row + 1, startColumnIndex: column, endColumnIndex: column + 1 },
        rows: [{ values: [{ userEnteredValue }] }], fields: "userEnteredValue" } };
    }) },
  });
  const saved = await readWeeklySheet(sources);
  if (WEEKLY_FIELDS.some(field => saved.values[field.key] !== values[field.key])) {
    throw new WeeklySheetError("Hasil penyimpanan perlu diperiksa. Muat ulang untuk melihat nilai terbaru.", 409);
  }
  return saved;
}
