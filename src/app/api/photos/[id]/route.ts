import { NextRequest, NextResponse } from "next/server";
import { updatePhotoCaption } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const caption = typeof body.caption === "string" ? body.caption : null;

    const photo = await updatePhotoCaption(parseInt(id), caption);

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json(
      { error: "Failed to update caption" },
      { status: 500 }
    );
  }
}
