import { sheetDate } from "./quarterlySchedule";
export interface SabbathSummary { date: string; title: string; verse: string; speaker: string; detailsReady: boolean; stale?: boolean }
type Cell = { v?: string | number | null; f?: string } | null;
type Row = { c?: Cell[] };
const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
function text(cell: Cell | undefined) { return String(cell?.f ?? cell?.v ?? "").trim(); }
export function upcomingSabbath(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)!.value;
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay()));
  return date.toISOString().slice(0, 10);
}
function dateValue(cell: Cell, year?: string) {
  const parsed = sheetDate(cell); if (parsed) return parsed;
  const raw = text(cell);
  if (/^20\d{2}-\d{2}-\d{2}$/.test(raw)) return sheetDate({v:(Date.parse(`${raw}T00:00:00Z`)/86400000)+25569});
  const full = /^([a-z]+)\s+(\d{1,2}),?\s+(20\d{2})$/i.exec(raw);
  if (full) {
    const month = months.indexOf(full[1].toLowerCase());
    if (month >= 0) return sheetDate({v:`Date(${full[3]},${month},${full[2]})`});
  }
  return year && /^\d{1,2}\s+[a-z]{3}$/i.test(raw) ? sheetDate({v:`${raw} ${year}`}) : null;
}
export function summaryRows(body: string): Row[] {
  const json = JSON.parse(body.slice(body.indexOf("{"), body.lastIndexOf("}") + 1));
  if (json.status === "error" || !Array.isArray(json.table?.rows)) throw new Error("Invalid sheet response");
  return json.table.rows;
}
export function buildSabbathSummary(details: Row[], participants: Row[], now = new Date()): SabbathSummary {
  const date = upcomingSabbath(now);
  const detailsReady = dateValue(details[0]?.c?.[1] ?? null) === date;
  const field = (label: string) => text(details.find(row => text(row.c?.[0]).toLowerCase() === label)?.c?.[1]);
  const header = participants.flatMap(row => row.c ?? []).map(text).join(" ");
  // Text-only date headers need an explicit sheet year: never assume the current year.
  const year = /TAHUN\s+(20\d{2})/i.exec(header)?.[1];
  const dates = participants.find(row => (row.c ?? []).some(cell => text(cell).toLowerCase() === "tanggal"));
  const index = dates?.c?.findIndex(cell => dateValue(cell, year) === date) ?? -1;
  const speakerRow = participants.find(row => text(row.c?.[0]).toLowerCase() === "pembicara");
  const speaker = index >= 0 ? text(speakerRow?.c?.[index]) : "";
  return { date, title: detailsReady ? field("judul khotbah") : "", verse: detailsReady ? field("ayat inti") : "",
    speaker: /^(?:-|\(tba\)|tba)$/i.test(speaker) ? "" : speaker, detailsReady };
}
