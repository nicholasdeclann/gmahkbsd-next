export interface AnnouncementItem {
  id: string;
  drive_file_id: string;
  department: string;
  caption: string | null;
  created_at: string;
  image_url: string;
}

export const ANNOUNCEMENT_MAX_BYTES = 4 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function announcementDetails(department: unknown, caption: unknown) {
  if (department !== null && department !== undefined && typeof department !== "string") throw new Error("Nama departemen tidak valid.");
  if (caption !== null && caption !== undefined && typeof caption !== "string") throw new Error("Keterangan tidak valid.");
  const label = (typeof department === "string" ? department.trim() : "") || "Umum";
  // Drive custom property keys and values together must fit in 124 UTF-8 bytes.
  if (new TextEncoder().encode(label).length > 100 || /[\u0000-\u001f]/.test(label)) throw new Error("Nama departemen terlalu panjang atau tidak valid.");
  const text = typeof caption === "string" ? caption.trim() : "";
  if (text.length > 2000) throw new Error("Keterangan maksimal 2.000 karakter.");
  return { department: label, caption: text || null };
}
