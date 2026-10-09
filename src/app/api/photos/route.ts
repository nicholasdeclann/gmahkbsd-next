import { NextRequest, NextResponse } from "next/server";
import { listAnnouncements, announcementStorageConfigured } from "@/lib/announcements";
import { isLocalDemo } from "@/lib/localDemo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    const photos = await listAnnouncements(department);
    return NextResponse.json({ photos, configured: announcementStorageConfigured(), mode: isLocalDemo() ? "demo" : "drive" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Pengumuman belum dapat dimuat. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
