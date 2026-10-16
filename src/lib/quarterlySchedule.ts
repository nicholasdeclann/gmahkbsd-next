export interface ScheduleRow { id: number; label: string; heading: boolean; values: string[] }
export interface QuarterlySchedule {
  year: number; quarter: number; today: string; dates: string[];
  missingDates: string[]; rows: ScheduleRow[];
  stale?: boolean;
}
type Cell = { v?: string | number | null; f?: string } | null;
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Read dates explicitly, without depending on the browser's date parser or timezone.
export function sheetDate(cell: Cell): string | null {
  if (!cell) return null;
  const raw = String(cell.v ?? "");
  const google = /^Date\((\d{4}),(\d{1,2}),(\d{1,2})(?:,.*)?\)$/.exec(raw);
  let year: number, month: number, day: number;
  if (google) {
    year = +google[1]; month = +google[2] + 1; day = +google[3];
  } else if (typeof cell.v === "number") {
    const date = new Date(Date.UTC(1899, 11, 30) + cell.v * 86400000);
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; day = date.getUTCDate();
  } else {
    const match = /^(\d{1,2})\s+([a-z]{3})\s+(\d{2}|\d{4})$/i.exec(cell.f || raw);
    if (!match) return null;
    year = +match[3] < 100 ? 2000 + +match[3] : +match[3];
    month = months.indexOf(match[2].toLowerCase()) + 1; day = +match[1];
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

export function parseQuarterlySchedule(text: string, now = new Date()): QuarterlySchedule {
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  if (json.status === "error" || !Array.isArray(json.table?.rows)) throw new Error("Invalid schedule response");
  const source: { c?: Cell[] }[] = json.table.rows;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const year = +part("year"), quarter = Math.floor((+part("month") - 1) / 3) + 1;
  const start = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, quarter * 3, 1)).toISOString().slice(0, 10);
  const columns = (source[0]?.c ?? []).flatMap((cell, index) => {
    const date = index > 0 ? sheetDate(cell) : null;
    return date && date >= start && date < end && new Date(`${date}T12:00:00Z`).getUTCDay() === 6 ? [{ index, date }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  const dates = columns.map(c => c.date);
  const missingDates: string[] = [];
  for (let date = new Date(`${start}T12:00:00Z`); date.toISOString().slice(0, 10) < end; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    if (date.getUTCDay() === 6 && !dates.includes(key)) missingDates.push(key);
  }
  // The bounded source starts with row 4; gviz omits completely blank rows.
  // All subsequent nonblank rows are the requested roles in rows 6–33.
  const rows = source.slice(1).map((sourceRow, index) => {
    const cells = sourceRow.c ?? [];
    const label = String(cells[0]?.f ?? cells[0]?.v ?? "").trim();
    return { id: index, label,
      heading: label === "Sekolah Sabat" || label === "Khotbah",
      values: columns.map(({ index }) => String(cells[index]?.f ?? cells[index]?.v ?? "").trim()) };
  }).filter(row => row.label);
  if (!rows.length) throw new Error("Schedule roles not found");
  return { year, quarter, today, dates, missingDates, rows };
}
