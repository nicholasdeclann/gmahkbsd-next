import { NextRequest, NextResponse } from "next/server";
import { listAnnouncements, announcementStorageConfigured } from "@/lib/announcements";
import { isAuthenticated } from "@/lib/adminAuth";
import { getPosterAssignments } from "@/lib/sabbathPosters";
import { isLocalDemo } from "@/lib/localDemo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    // Expired posts are only listed for staff (`?manage=true` with a valid session).
    const manage = searchParams.get("manage") === "true";
    if (manage && !(await isAuthenticated())) return NextResponse.json({ error: "Silakan masuk kembali.", code: "ADMIN_REQUIRED" }, { status: 401 });
    const [posts, assignments] = await Promise.all([listAnnouncements({ department, includeExpired: manage }), getPosterAssignments()]);
    const photos = posts.map(post => { const date = Object.keys(assignments.assignments).find(date => assignments.assignments[date] === post.id) ?? null; return { ...post, replacement_date: date, replacement_active: Boolean(date && !post.expired && post.due_date && post.due_date >= date) }; });
    return NextResponse.json({ photos, configured: announcementStorageConfigured(), mode: isLocalDemo() ? "demo" : "drive" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Pengumuman belum dapat dimuat. Silakan coba lagi." },
      { status: 502 }
    );
  }
}
