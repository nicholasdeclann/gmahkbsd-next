import { NextResponse } from "next/server";
import { deleteOldItems, getAllItems } from "@/lib/db";
import { isAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// List every item (admin dashboard view).
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const items = await getAllItems();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// Purge all items created before the current week.
export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const removed = await deleteOldItems();
    return NextResponse.json({ removed });
  } catch {
    return NextResponse.json({ error: "Failed to clean up" }, { status: 500 });
  }
}
