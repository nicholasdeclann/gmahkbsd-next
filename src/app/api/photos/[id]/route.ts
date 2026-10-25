import { NextRequest, NextResponse } from "next/server";
import { editAnnouncement, deleteAnnouncement, AnnouncementError } from "@/lib/announcements";
import { announcementPatch } from "@/lib/announcementTypes";
import { adminRequestError } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) return NextResponse.json({ error: "Pengumuman tidak valid." }, { status: 400 });
    await deleteAnnouncement(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof AnnouncementError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ error: "Pengumuman belum berhasil dihapus. Pastikan akun gereja memiliki izin menghapus file, lalu coba lagi." }, { status: 502 });
  }
}

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
    // Partial update: only the fields that were sent are validated and changed.
    let patch;
    try { patch = announcementPatch(body as Record<string, unknown>); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const photo = await editAnnouncement(id, patch);

    if (!photo) {
      return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    if (error instanceof AnnouncementError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json(
      { error: "Perubahan belum berhasil disimpan. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
