import { NextRequest, NextResponse } from "next/server";
import { editAnnouncement, AnnouncementError } from "@/lib/announcements";
import { announcementDetails } from "@/lib/announcementTypes";
import { adminRequestError } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
  try {
    const { id } = await params;

    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) {
      return NextResponse.json({ error: "Pengumuman tidak valid." }, { status: 400 });
    }

    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Formulir tidak valid." }, { status: 400 });
    let caption;
    try { caption = announcementDetails(null, body.caption).caption; }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const photo = await editAnnouncement(id, caption);

    if (!photo) {
      return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    if (error instanceof AnnouncementError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json(
      { error: "Keterangan belum berhasil disimpan. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
