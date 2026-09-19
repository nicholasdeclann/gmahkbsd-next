import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeekItems, createItem } from "@/lib/db";
import { isAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getCurrentWeekItems();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Failed to load prayer list" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim()
        : null;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await createItem(name, note);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
