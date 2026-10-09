import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeekItems, createItem } from "@/lib/db";
import { adminRequestError } from "@/lib/adminRequest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getCurrentWeekItems();
    return NextResponse.json({ items: items.map(({ id, name, note }) => ({ id, name, note })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Failed to load prayer list" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await adminRequestError(req);
  if (authError) return authError;
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
    const item = await createItem(name, note, body.note_public === true);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
