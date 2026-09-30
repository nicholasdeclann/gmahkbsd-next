import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOAuthClient } from "@/lib/drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const redirectUrl = new URL("/pengumuman", req.url);

  if (error) {
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.redirect(redirectUrl);
    }

    const store = await cookies();
    store.set("google_drive_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("OAuth callback error:", err.message || err);
    return NextResponse.redirect(redirectUrl);
  }
}
