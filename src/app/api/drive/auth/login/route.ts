import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/drive";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.json({ authUrl });
}
