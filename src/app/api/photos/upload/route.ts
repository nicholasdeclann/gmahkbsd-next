import { NextRequest, NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { announcementDetails, ANNOUNCEMENT_IMAGE_TYPES, ANNOUNCEMENT_MAX_BYTES } from "@/lib/announcementTypes";
import { AnnouncementError, publishAnnouncement } from "@/lib/announcements";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
  try {
    if (Number(req.headers.get("content-length")) > ANNOUNCEMENT_MAX_BYTES + 100_000) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 4 MB." }, { status: 413 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Pilih gambar pengumuman terlebih dahulu." }, { status: 400 });
    if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "Gunakan gambar JPG, PNG, atau WebP." }, { status: 400 });
    if (file.size > ANNOUNCEMENT_MAX_BYTES) return NextResponse.json({ error: "Ukuran gambar maksimal 4 MB." }, { status: 413 });
    let details;
    try {
      details = announcementDetails({ department: form.get("department"), title: form.get("title"), caption: form.get("caption"), due_date: form.get("due_date") });
    } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const photo = await publishAnnouncement(file, details);
    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    if (error instanceof AnnouncementError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("Announcement publishing failed");
    return NextResponse.json({ error: "Pengumuman belum berhasil diterbitkan. Periksa koneksi Drive di Pengaturan lalu coba lagi." }, { status: 502 });
  }
}
