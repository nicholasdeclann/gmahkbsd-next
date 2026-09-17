import { NextResponse } from "next/server";
import { churchConfig } from "@/config/church";
import { buildSheetExportUrl } from "@/lib/kertasAcaraExport";

// This route proxies Google Sheets' native PDF export so the browser can fetch
// it without hitting cross-origin restrictions. It runs only on Vercel; the
// static-export build (GitHub Pages) removes the `api` directory entirely
// before building, and the client falls back to a direct Google PDF link.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = buildSheetExportUrl(churchConfig.kertasAcara.export);

  const upstream = await fetch(url, { cache: "no-store" });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch export from Google Sheets" },
      { status: 502 },
    );
  }

  const pdf = await upstream.arrayBuffer();

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
    },
  });
}
