import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOAuthClient, DRIVE_STATE_COOKIE, saveDriveCredentials } from "@/lib/drive";
import { isAuthenticated } from "@/lib/adminAuth";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const redirectUrl = new URL("/admin/settings", req.url);
  const store = await cookies();
  const expected = store.get(DRIVE_STATE_COOKIE)?.value ?? "";
  store.delete(DRIVE_STATE_COOKIE);
  const state = searchParams.get("state") ?? "";
  const validState = /^[a-f0-9]{64}$/.test(expected) && /^[a-f0-9]{64}$/.test(state) && timingSafeEqual(Buffer.from(expected), Buffer.from(state));
  if (!(await isAuthenticated()) || !validState) {
    redirectUrl.searchParams.set("drive", "error");
    return NextResponse.redirect(redirectUrl);
  }

  if (error) {
    redirectUrl.searchParams.set("drive", "error");
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set("drive", "error");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken || !tokens.refresh_token) {
      redirectUrl.searchParams.set("drive", "error");
      return NextResponse.redirect(redirectUrl);
    }

    await saveDriveCredentials(tokens);
    store.delete("google_drive_token");
    redirectUrl.searchParams.set("drive", "connected");

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    redirectUrl.searchParams.set("drive", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
