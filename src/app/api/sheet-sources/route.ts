import { NextResponse } from "next/server";
import { getSheetSources } from "@/lib/sheetSettings";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getSheetSources(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Sumber spreadsheet belum dapat dimuat." }, { status: 503 }); }
}
