import { NextResponse } from "next/server";
import { churchConfig } from "@/config/church";
import { buildSheetExportUrl } from "@/lib/kertasAcaraExport";

// This route is only used in the Vercel (non-static-export) deployment. It
// proxies Google Sheets' native PDF export so the browser can fetch it without
// hitting cross-origin restrictions. Static-export builds (GitHub Pages) skip
// the API entirely and download the PDF via a direct link instead.
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
