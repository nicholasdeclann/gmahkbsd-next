import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { adminRequestError } from "@/lib/adminRequest";
import { listAnnouncements } from "@/lib/announcements";
import { assignPoster, getPosterAssignments, PosterError } from "@/lib/sabbathPosters";
import { posterDate } from "@/lib/sabbathPosterTypes";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof PosterError ? error.message : "Penetapan poster belum berhasil. Refresh lalu coba lagi." }, { status: error instanceof PosterError ? error.status : 502, headers });
}
export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });
  try {
    const [state, posts] = await Promise.all([getPosterAssignments(), listAnnouncements({ includeExpired: true })]);
    return NextResponse.json({ ...state, posters: posts.filter(post => Object.values(state.assignments).includes(post.id)).map(post => ({ id: post.id, title: post.title, image_url: post.image_url })) }, { headers });
  } catch (error) { return failure(error); }
}
export async function PUT(req: NextRequest) {
  const denied = await adminRequestError(req); if (denied) return denied;
  try {
    const body = await req.json();
    let date: string;
    try { date = posterDate(body?.date); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    if (typeof body.revision !== "string" || (body.id !== null && (typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(body.id)))) return NextResponse.json({ error: "Penetapan poster tidak valid." }, { status: 400 });
    if (body.id) {
      const post = (await listAnnouncements()).find(post => post.id === body.id);
      if (!post || !post.due_date || post.due_date < date) return NextResponse.json({ error: "Tanggal berakhir pengumuman harus pada atau setelah Sabat yang dipilih." }, { status: 400 });
    }
    return NextResponse.json(await assignPoster(date, body.id, body.revision), { headers });
  } catch (error) { return failure(error); }
}
