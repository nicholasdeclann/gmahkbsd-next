import { NextRequest, NextResponse } from "next/server";
import { updateItem, deleteItem } from "@/lib/db";
import { adminRequestError } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim()
        : null;
    if (!name || name.length > 200 || (note?.length ?? 0) > 2000) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await updateItem(numId, name, note, body.note_public === true);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await deleteItem(numId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
