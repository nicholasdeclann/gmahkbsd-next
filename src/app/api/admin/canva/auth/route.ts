import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { adminRequestError } from "@/lib/adminRequest";
import { canvaConfigured, canvaCookieOptions } from "@/lib/canva";
export async function POST(request: Request) {
  const denied = await adminRequestError(request); if (denied) return denied;
  if (!canvaConfigured()) return NextResponse.json({ error: "Koneksi Canva belum diatur." }, { status: 503 });
  const state = randomBytes(32).toString("base64url"), verifier = randomBytes(64).toString("base64url");
  const store = await cookies();
  store.set("canva_oauth_state", state, { ...canvaCookieOptions, maxAge: 600 });
  store.set("canva_oauth_verifier", verifier, { ...canvaCookieOptions, maxAge: 600 });
  const url = new URL("https://www.canva.com/api/oauth/authorize");
  url.search = new URLSearchParams({ client_id: process.env.CANVA_CLIENT_ID!, redirect_uri: process.env.CANVA_REDIRECT_URI!, response_type: "code", scope: "design:content:read design:content:write", state, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
  return NextResponse.json({ url: url.toString() });
}
