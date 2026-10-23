export const CHURCH_TIMEZONE = "Asia/Jakarta";

export function rollForwardSabbath(selected: string, dates: string[], now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CHURCH_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay() + 7) % 7);
  const upcoming = date.toISOString().slice(0, 10);
  return selected && selected < upcoming && dates.includes(upcoming) ? upcoming : selected;
}

export function churchWeekStart(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CHURCH_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return new Date(Date.parse(`${date}T00:00:00+07:00`) - weekday * 86_400_000).toISOString();
}

export const WEEKLY_FIELDS = [
  { key: "date", cell: "C2", label: "Tanggal Sabat" },
  { key: "sermonTitle", cell: "C3", label: "Judul Khotbah" },
  { key: "mainVerse", cell: "C4", label: "Ayat Inti" },
  { key: "responsiveReading", cell: "C5", label: "Ayat Bersahutan" },
  { key: "openingHymn", cell: "C6", label: "Lagu Pembuka — Kebaktian" },
  { key: "closingHymn", cell: "C7", label: "Lagu Penutup — Kebaktian" },
  { key: "ssOpeningHymn", cell: "J6", label: "Lagu Pembuka — Sekolah Sabat" },
  { key: "ssClosingHymn", cell: "J7", label: "Lagu Penutup — Sekolah Sabat" },
] as const;

export type WeeklyField = (typeof WEEKLY_FIELDS)[number]["key"];
export type WeeklyValues = Record<WeeklyField, string>;
export interface HymnOption { number: string; title: string }
export interface WeeklySnapshot {
  values: WeeklyValues;
  revision: string;
  dates: string[];
  hymns: HymnOption[];
  mode: "demo" | "google";
  canWrite: boolean;
}

const DAY = 86_400_000;
export function dateToSerial(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) / DAY + 25569;
}
export function serialToDate(value: number): string {
  return new Date(Math.round(value - 25569) * DAY).toISOString().slice(0, 10);
}
export function formatChurchDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: CHURCH_TIMEZONE, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export function validateWeeklyValues(input: unknown, snapshot: WeeklySnapshot): WeeklyValues {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Formulir tidak valid.");
  const record = input as Record<string, unknown>;
  const values = {} as WeeklyValues;
  for (const field of WEEKLY_FIELDS) {
    const value = record[field.key];
    if (typeof value !== "string" || value.length > 2000) throw new Error(`${field.label} tidak valid.`);
    values[field.key] = value.trim();
  }
  if (!snapshot.dates.includes(values.date)) throw new Error("Pilih tanggal Sabat yang tersedia di spreadsheet.");
  for (const key of ["openingHymn", "closingHymn", "ssOpeningHymn", "ssClosingHymn"] as const) {
    if (values[key] && !snapshot.hymns.some(hymn => hymn.number === values[key])) {
      throw new Error("Nomor lagu tidak ditemukan dalam Lagu Sion.");
    }
  }
  return values;
}
