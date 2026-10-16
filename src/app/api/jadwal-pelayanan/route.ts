import { NextResponse } from "next/server";
import { getSheetSources } from "@/lib/sheetSettings";
import { parseQuarterlySchedule } from "@/lib/quarterlySchedule";
import { readQuarterlySource } from "@/lib/quarterlyScheduleSource";

export async function GET(request: Request) {
  try {
    const { sheetId, quarterlyScheduleGid } = (await getSheetSources()).liturgy;
    const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    url.search = new URLSearchParams({ gid: quarterlyScheduleGid, range: "B4:CZ33", headers: "0", tqx: "out:json" }).toString();
    const force = new URL(request.url).searchParams.get("refresh") === "1";
    const source = await readQuarterlySource(url.toString(), force, text => { parseQuarterlySchedule(text); });
    // Compute the current quarter on each request, even when sheet contents are cached.
    return NextResponse.json({ ...parseQuarterlySchedule(source.text), stale: source.stale }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("Quarterly schedule read failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Jadwal belum dapat dimuat. Silakan coba lagi." }, { status: 502 });
  }
}
