import { NextRequest, NextResponse } from "next/server";
import { listAnnouncements, announcementStorageConfigured } from "@/lib/announcements";
import { isAuthenticated } from "@/lib/adminAuth";
import { isLocalDemo } from "@/lib/localDemo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    // Expired posts are only listed for staff (`?manage=true` with a valid session).
    const manage = searchParams.get("manage") === "true";
    if (manage && !(await isAuthenticated())) return NextResponse.json({ error: "Silakan masuk kembali.", code: "ADMIN_REQUIRED" }, { status: 401 });
    const photos = await listAnnouncements({ department, includeExpired: manage });
    return NextResponse.json({ photos, configured: announcementStorageConfigured(), mode: isLocalDemo() ? "demo" : "drive" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Pengumuman belum dapat dimuat. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
