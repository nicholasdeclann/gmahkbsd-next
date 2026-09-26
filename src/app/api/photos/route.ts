import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, getDriveService } from "@/lib/drive";
import { getPhotos } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || "Sekolah Sabat";

    // Get photos from database (with captions)
    const photos = await getPhotos(department);

    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json(
      { error: "Failed to load photos" },
      { status: 500 }
    );
  }
}
