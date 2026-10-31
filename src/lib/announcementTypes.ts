export interface AnnouncementItem {
  id: string;
  drive_file_id: string;
  department: string;
  /** Always present: the stored title, or a title derived from the caption/department for older posts. */
  title: string;
  caption: string | null;
  /** "YYYY-MM-DD" in Asia/Jakarta. Null only for older posts that predate due dates. */
  due_date: string | null;
  /** Computed on the server for "today" in Asia/Jakarta. */
  expired: boolean;
  created_at: string;
  image_url: string;
  replacement_date?: string | null;
  replacement_active?: boolean;
  width?: number;
  height?: number;
}

export const ANNOUNCEMENT_MAX_BYTES = 4 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ANNOUNCEMENT_TITLE_MAX = 80;
export const ANNOUNCEMENT_CAPTION_MAX = 2000;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

/** Today's calendar date in Jakarta, as YYYY-MM-DD. */
export function todayJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function validDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** Whole days from today (Jakarta) until the date. 0 = today, negative = past. */
export function daysUntil(date: string, now: Date = new Date()): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayJakarta(now)}T00:00:00Z`)) / DAY);
}

/** The coming Sabbath (Saturday), or today if today is Saturday. Used as the default due date. */
export function nextSabbath(now: Date = new Date()): string {
  const today = todayJakarta(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  return addDays(today, (6 - weekday + 7) % 7);
}

/** An announcement stays visible through its due date and is hidden from the next day. */
export function isExpired(due: string | null | undefined, now: Date = new Date()): boolean {
  return Boolean(due) && (due as string) < todayJakarta(now);
}

export function fallbackTitle(caption: string | null | undefined, department: string): string {
  const first = (caption ?? "").split(/\r?\n/).map(line => line.trim()).find(Boolean);
  if (!first) return `Pengumuman ${department}`;
  return first.length > ANNOUNCEMENT_TITLE_MAX ? `${first.slice(0, ANNOUNCEMENT_TITLE_MAX - 1).trimEnd()}…` : first;
}

/** Fill in the derived fields (title fallback, expired flag) for a stored post. */
export function deriveAnnouncement(
  raw: Omit<AnnouncementItem, "title" | "expired"> & { title?: string | null },
  now: Date = new Date(),
): AnnouncementItem {
  const due = raw.due_date && validDateString(raw.due_date) ? raw.due_date : null;
  return { ...raw, due_date: due, title: raw.title?.trim() || fallbackTitle(raw.caption, raw.department), expired: isExpired(due, now) };
}

/**
 * Board order: active posts first, soonest due date first (undated last, newest first among those);
 * expired posts last, most recently expired first.
 */
export function compareAnnouncements(a: AnnouncementItem, b: AnnouncementItem): number {
  if (a.expired !== b.expired) return a.expired ? 1 : -1;
  const newest = b.created_at.localeCompare(a.created_at);
  if (a.expired) return (b.due_date ?? "").localeCompare(a.due_date ?? "") || newest;
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date) || newest;
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return newest;
}

function cleanDepartment(department: unknown) {
  if (department !== null && department !== undefined && typeof department !== "string") throw new Error("Nama departemen tidak valid.");
  const label = (typeof department === "string" ? department.trim() : "") || "Umum";
  // Drive custom property keys and values together must fit in 124 UTF-8 bytes.
  if (new TextEncoder().encode(label).length > 100 || /[\u0000-\u001f]/.test(label)) throw new Error("Nama departemen terlalu panjang atau tidak valid.");
  return label;
}

function cleanTitle(title: unknown) {
  if (typeof title !== "string" || !title.trim()) throw new Error("Judul pengumuman wajib diisi.");
  const text = title.trim().replace(/\s+/g, " ");
  if (text.length > ANNOUNCEMENT_TITLE_MAX) throw new Error(`Judul maksimal ${ANNOUNCEMENT_TITLE_MAX} karakter.`);
  if (/[\u0000-\u001f]/.test(text)) throw new Error("Judul tidak valid.");
  return text;
}

function cleanCaption(caption: unknown) {
  if (caption !== null && caption !== undefined && typeof caption !== "string") throw new Error("Keterangan tidak valid.");
  const text = typeof caption === "string" ? caption.trim() : "";
  if (text.length > ANNOUNCEMENT_CAPTION_MAX) throw new Error("Keterangan maksimal 2.000 karakter.");
  return text || null;
}

function cleanDue(due: unknown, allowPast: boolean, now: Date) {
  if (due === null || due === undefined || due === "") throw new Error("Tanggal berakhir wajib diisi.");
  if (!validDateString(due)) throw new Error("Tanggal berakhir tidak valid.");
  if (!allowPast && due < todayJakarta(now)) throw new Error("Tanggal berakhir tidak boleh sebelum hari ini.");
  return due;
}

/** Validate a new announcement. Title and due date are required; the due date cannot be in the past. */
export function announcementDetails(
  input: { department?: unknown; title?: unknown; caption?: unknown; due_date?: unknown },
  now: Date = new Date(),
) {
  return {
    department: cleanDepartment(input.department),
    title: cleanTitle(input.title),
    caption: cleanCaption(input.caption),
    due_date: cleanDue(input.due_date, false, now),
  };
}

export interface AnnouncementPatch { title?: string; caption?: string | null; due_date?: string; department?: string }

/** Validate a partial edit. Only provided fields are returned. A past due date is allowed so staff can end a post early. */
export function announcementPatch(body: Record<string, unknown>, now: Date = new Date()): AnnouncementPatch {
  const patch: AnnouncementPatch = {};
  if ("title" in body) patch.title = cleanTitle(body.title);
  if ("caption" in body) patch.caption = cleanCaption(body.caption);
  if ("due_date" in body) patch.due_date = cleanDue(body.due_date, true, now);
  if ("department" in body) patch.department = cleanDepartment(body.department);
  if (!Object.keys(patch).length) throw new Error("Tidak ada perubahan yang dikirim.");
  return patch;
}
