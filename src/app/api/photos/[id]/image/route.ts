import { NextResponse } from "next/server";
import { AnnouncementError, announcementImage } from "@/lib/announcements";
import { isAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await isAuthenticated();
    const image = await announcementImage(id, { admin });
    return new NextResponse(new Uint8Array(image.bytes), { headers: { "Content-Type": image.mime,
      "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Vary": "Cookie" } });
  } catch (error) {
    return NextResponse.json({ error: "Gambar belum dapat dimuat." }, { status: error instanceof AnnouncementError ? error.status : 502 });
  }
}
