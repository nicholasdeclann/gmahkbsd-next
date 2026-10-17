import type { PrayerSnapshot } from "./prayerTypes";
import type { QuarterlySchedule } from "./quarterlySchedule";
import type { AnnouncementItem } from "./announcementTypes";

export const CANVA_DESIGN_ID = "DAG-9nAgcSE";
export function announcementDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  const day = new Date(`${value("year")}-${value("month")}-${value("day")}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + (6 - day.getUTCDay()));
  const current = day.toISOString().slice(0, 10);
  day.setUTCDate(day.getUTCDate() + 7);
  return { current, next: day.toISOString().slice(0, 10) };
}
export function buildCanvaPreview(date: string, prayer: PrayerSnapshot, schedule: QuarterlySchedule | null, announcements: AnnouncementItem[]) {
  const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 7);
  const nextDate = next.toISOString().slice(0, 10);
  const warnings: string[] = [];
  const blockingErrors: string[] = [];
  const fields: Record<string, string> = { current_sabbath: date, next_sabbath: nextDate };
  const column = schedule?.dates.indexOf(nextDate) ?? -1;
  if (column < 0 || schedule?.stale) blockingErrors.push(`Jadwal pelayanan terbaru untuk ${nextDate} belum tersedia.`);
  let section = "umum";
  const participants = (schedule?.rows ?? []).flatMap(row => {
    const slug = row.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (row.heading) { section = slug; return []; }
    return [{ field: `participant_${section}_${slug}`, label: `${section.replaceAll("_", " ")} · ${row.label}`, value: column >= 0 ? row.values[column] || "" : "" }];
  });
  for (const participant of participants) {
    fields[participant.field] = participant.value;
    if (!participant.value || /^(?:-|\(tba\)|tba)$/i.test(participant.value)) warnings.push(`${participant.label} belum diisi.`);
  }
  if (prayer.date !== date) blockingErrors.push(`Pokok Doa masih bertanggal ${prayer.date || "kosong"}; simpan untuk ${date} terlebih dahulu.`);
  const prayers = Array.from({ length: 4 }, (_, index) => {
    const slot = prayer.slots[index];
    const item = prayer.date === date && slot ? { name: slot.name, note: slot.note_public ? slot.note : "" } : { name: "", note: "" };
    fields[`prayer_name_${index + 1}`] = item.name;
    fields[`prayer_note_${index + 1}`] = item.note;
    return item;
  });
  if (!prayers.some(slot => slot.name)) blockingErrors.push("Pokok Doa minggu ini belum diisi.");
  return { date, nextDate, fields, participants, prayers, announcements: announcements.map(({ id, department, caption, image_url }) => ({ id, department, caption, image_url })), warnings, blockingErrors };
}
export type CanvaPreview = ReturnType<typeof buildCanvaPreview>;
export function selectedCanvaFields(preview: CanvaPreview, ids: string[]) {
  if (ids.length > 20 || new Set(ids).size !== ids.length || ids.some(id => !preview.announcements.some(item => item.id === id))) throw new Error("Pilihan pengumuman tidak valid (maksimal 20).");
  return { ...preview.fields, announcements: ids.map(id => {
    const item = preview.announcements.find(item => item.id === id)!;
    return `${item.department}\n${item.caption || ""}`.trim();
  }).join("\n\n") };
}
