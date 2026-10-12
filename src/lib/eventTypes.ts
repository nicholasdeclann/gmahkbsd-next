export interface EventPhoto {
  id: string; title: string; eventDate: string; caption: string; published: boolean; imageUrl: string;
}
export const EVENT_MAX_BYTES = 4 * 1024 * 1024;
export const EVENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export function jakartaMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}
export function previousMonth(now = new Date()): string {
  const [year, month] = jakartaMonth(now).split("-").map(Number);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
}
export function validMonth(value: string): boolean { return /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value); }
export function monthLabel(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}-01T12:00:00+07:00`));
}
export function eventDetails(body: Record<string, unknown>) {
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 150) throw new Error("Isi nama kegiatan (maksimal 150 karakter).");
  if (typeof body.eventDate !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(body.eventDate) || !validMonth(body.eventDate.slice(0, 7))) throw new Error("Tanggal kegiatan tidak valid.");
  const date = new Date(`${body.eventDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.eventDate) throw new Error("Tanggal kegiatan tidak valid.");
  // Jakarta's current date, rather than the server's UTC day.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const todayString = ["year", "month", "day"].map(type => today.find(p => p.type === type)!.value).join("-");
  if (body.eventDate > todayString) throw new Error("Pilih tanggal kegiatan yang sudah berlangsung.");
  if (typeof body.caption !== "string" || body.caption.trim().length > 2000) throw new Error("Keterangan maksimal 2.000 karakter.");
  if (typeof body.published !== "boolean") throw new Error("Status penerbitan tidak valid.");
  return { title: body.title.trim(), eventDate: body.eventDate, caption: body.caption.trim(), published: body.published };
}
