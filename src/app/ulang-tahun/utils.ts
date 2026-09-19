import { churchConfig } from "@/config/church";

export interface Birthday {
  /** Day of month (1-31). */
  day: number;
  /** Month index (0-11). */
  month: number;
}

export interface BirthdayPerson {
  nama: string;
  birthday: Birthday;
  /** Date object for this year's occurrence, used for sorting/formatting. */
  birthdayDate: Date;
  dayName: string;
}

const { sheetId, tabGids } = churchConfig.sheets.birthdays;

// URLs for every birthday tab; the app fetches and merges them all.
export const SHEET_URLS = tabGids.map(
  (gid) =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`,
);

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Get current week range (Sunday to Saturday/Sabbath)
export const getCurrentWeekRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate Sunday of this week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  // Calculate Saturday (Sabbath) of this week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { sunday, saturday };
};

// Format date as "DD MMMM" (e.g. "19 Februari")
export const formatDateShort = (date: Date) => {
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]}`;
};

// Format date as "DD MMMM YYYY"
export const formatDateLong = (date: Date) => {
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// Resolve an Indonesian month name to a 0-based month index. Accepts either the
// full name (e.g. "Februari") or a numeric string (e.g. "2").
const parseMonth = (monthValue: unknown): number | null => {
  if (monthValue === null || monthValue === undefined) return null;

  const raw = String(monthValue).trim();
  if (!raw) return null;

  // Numeric month (1-12)
  const asNumber = Number(raw);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 12) {
    return asNumber - 1;
  }

  const index = INDONESIAN_MONTHS.findIndex(
    (m) => m.toLowerCase() === raw.toLowerCase(),
  );
  return index >= 0 ? index : null;
};

// Parse day + month from a "Tanggal" string in column B. Handles both:
//   "01-01-1975"       (day-numericMonth-year)
//   "19-Februari-1948" (day-monthName-year)
// Separators may be "-", "/", or spaces. The year is ignored.
const parseTanggal = (
  tanggalValue: unknown,
): { day: number; month: number } | null => {
  if (tanggalValue === null || tanggalValue === undefined) return null;

  const raw = String(tanggalValue).trim();
  if (!raw) return null;

  const parts = raw.split(/[-/\s]+/).filter(Boolean);
  if (parts.length < 2) return null;

  const day = Number(parts[0]);
  const month = parseMonth(parts[1]);

  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  if (month === null) return null;

  return { day, month };
};

/**
 * Parse a birthday row. Columns:
 *   A (0) = Nama, B (1) = Tanggal, C (2) = Hari (day), D (3) = Bulan (month)
 * Prefers the explicit Hari/Bulan columns; when they are empty, falls back to
 * parsing the Tanggal string (column B), which some tabs use instead. The
 * birth year is intentionally ignored — only month and day are used.
 */
export const parseBirthdayRow = (
  cells: ({ v?: unknown } | null)[],
): { nama: string; birthday: Birthday } | null => {
  const nama = cells[0]?.v ? String(cells[0].v).trim() : "";
  if (!nama || nama.toLowerCase() === "nama") return null;

  const day = Number(cells[2]?.v);
  const month = parseMonth(cells[3]?.v);

  // Primary source: explicit Hari (C) + Bulan (D) columns.
  if (Number.isInteger(day) && day >= 1 && day <= 31 && month !== null) {
    return { nama, birthday: { day, month } };
  }

  // Fallback: parse the Tanggal string (column B).
  const fromTanggal = parseTanggal(cells[1]?.v);
  if (fromTanggal) {
    return { nama, birthday: fromTanggal };
  }

  return null;
};

// Check if a birthday (month + day only) falls within the current week
export const isBirthdayThisWeek = (
  birthday: Birthday,
  weekRange: { sunday: Date; saturday: Date },
) => {
  if (!birthday) return false;

  const currentYear = new Date().getFullYear();
  const birthdayThisYear = new Date(
    currentYear,
    birthday.month,
    birthday.day,
  );

  return (
    birthdayThisYear >= weekRange.sunday &&
    birthdayThisYear <= weekRange.saturday
  );
};

// Get day name in Indonesian
export const getDayName = (date: Date) => {
  return INDONESIAN_DAYS[date.getDay()];
};
