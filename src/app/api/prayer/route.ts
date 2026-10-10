import { NextResponse } from "next/server";
import { publicPrayerItems } from "@/lib/prayerSheet";
import { adminRequestError } from "@/lib/adminRequest";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json({ items: await publicPrayerItems() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Daftar doa belum dapat dimuat. Silakan coba lagi." }, { status: 502 }); }
}
export async function POST(request: Request) {
  const authError = await adminRequestError(request); if (authError) return authError;
  return NextResponse.json({ error: "Daftar doa kini menggunakan empat slot. Buka kembali halaman Pokok Doa pada dashboard." }, { status: 409 });
}
