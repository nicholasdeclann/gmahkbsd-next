import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminRequestError } from "@/lib/adminRequest";
import { canvaConfigured, exchangeCanvaToken } from "@/lib/canva";
export async function GET(request: Request) {
  const denied = await adminRequestError(); if (denied) return denied;
  const store = await cookies(), params = new URL(request.url).searchParams;
  const state = store.get("canva_oauth_state")?.value, verifier = store.get("canva_oauth_verifier")?.value;
  store.delete("canva_oauth_state"); store.delete("canva_oauth_verifier");
  if (!canvaConfigured() || !state || !verifier || state !== params.get("state") || !params.get("code")) return NextResponse.json({ error: "Otorisasi Canva dibatalkan atau kedaluwarsa. Kembali ke Presentasi Canva dan hubungkan ulang." }, { status: 400 });
  try {
    await exchangeCanvaToken(new URLSearchParams({ grant_type: "authorization_code", code: params.get("code")!, code_verifier: verifier, redirect_uri: process.env.CANVA_REDIRECT_URI! }));
    return NextResponse.redirect(new URL("/admin/canva", process.env.CANVA_REDIRECT_URI));
  } catch { return NextResponse.json({ error: "Koneksi Canva gagal. Kembali ke Presentasi Canva dan hubungkan ulang." }, { status: 502 }); }
}
