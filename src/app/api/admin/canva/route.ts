import { NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { loadCanvaPreview } from "@/lib/canvaData";
import { canvaRequest, canvaStatus, validateCanvaFields } from "@/lib/canva";
import { CANVA_DESIGN_ID, selectedCanvaFields } from "@/lib/canvaPreview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const denied = await adminRequestError(); if (denied) return denied;
  try {
    const job = new URL(request.url).searchParams.get("job");
    if (job) {
      if (!/^[a-zA-Z0-9_-]{1,150}$/.test(job)) return NextResponse.json({ error: "ID sinkronisasi tidak valid." }, { status: 400 });
      const result = await canvaRequest(`autofills/${job}`);
      return NextResponse.json({ status: result.job?.status, error: result.job?.status === "failed" ? "Sinkronisasi Canva gagal. Periksa desain dan coba lagi." : undefined }, { headers: { "Cache-Control": "no-store" } });
    }
    const [preview, connection] = await Promise.all([loadCanvaPreview(), canvaStatus()]);
    if (connection.ready) {
      try { await validateCanvaFields({ ...preview.fields, announcements: "" }); }
      catch (error) { connection.ready = false; connection.message = error instanceof Error ? error.message : "Field Canva belum dapat diperiksa."; }
    }
    return NextResponse.json({ preview, connection }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Pratinjau belum dapat dimuat." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const denied = await adminRequestError(request); if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 }); }
  if (typeof body?.revision !== "string" || !Array.isArray(body.announcementIds) || body.announcementIds.some((id: unknown) => typeof id !== "string")) return NextResponse.json({ error: "Muat pratinjau terlebih dahulu." }, { status: 400 });
  try {
    const preview = await loadCanvaPreview();
    if (preview.demo) return NextResponse.json({ error: "Mode latihan tidak dapat mengubah presentasi Canva." }, { status: 409 });
    if (preview.revision !== body.revision) return NextResponse.json({ error: "Data berubah. Perbarui pratinjau sebelum sinkronisasi." }, { status: 409 });
    if (preview.blockingErrors.length) return NextResponse.json({ error: "Lengkapi data pada pratinjau sebelum sinkronisasi." }, { status: 409 });
    const fields = selectedCanvaFields(preview, body.announcementIds);
    await validateCanvaFields(fields);
    const data = Object.fromEntries(Object.entries(fields).map(([name, text]) => [name, { type: "text", text }]));
    const result = await canvaRequest("autofills", { type: "update_design", design_id: CANVA_DESIGN_ID, data });
    if (!result.job?.id) throw new Error("Canva belum mengonfirmasi sinkronisasi. Periksa presentasi sebelum mencoba lagi.");
    return NextResponse.json({ job: result.job.id, status: result.job.status });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Sinkronisasi belum berhasil." }, { status: 503 }); }
}
