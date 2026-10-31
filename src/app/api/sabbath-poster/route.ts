import { NextRequest, NextResponse } from "next/server";
import { resolveSabbathPoster } from "@/lib/sabbathPresentation";
import { posterDate } from "@/lib/sabbathPosterTypes";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  let date: string;
  try { date = posterDate(req.nextUrl.searchParams.get("date")); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
  try { return NextResponse.json({ date, poster: await resolveSabbathPoster(date) }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Penetapan poster belum dapat dimuat. Silakan coba lagi." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
