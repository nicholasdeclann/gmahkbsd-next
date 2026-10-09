import { NextResponse } from "next/server";
import { AnnouncementError, announcementImage } from "@/lib/announcements";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const image = await announcementImage(id);
    return new NextResponse(new Uint8Array(image.bytes), { headers: { "Content-Type": image.mime,
      "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    return NextResponse.json({ error: "Gambar belum dapat dimuat." }, { status: error instanceof AnnouncementError ? error.status : 502 });
  }
}
