import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ authenticated: await isAuthenticated() }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
