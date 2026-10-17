import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { CANVA_DESIGN_ID } from "./canvaPreview";

const credentialCookie = "canva_credentials";
export const canvaCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 7 * 86400 };
type Credentials = { access_token: string; refresh_token: string; expires: number };
export function canvaConfigured() { return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET && process.env.CANVA_REDIRECT_URI); }
function key() {
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.length < 32) throw new Error("Konfigurasi admin belum lengkap.");
  return createHash("sha256").update(`canva:${process.env.ADMIN_SECRET}`).digest();
}
export async function saveCanvaCredentials(value: Credentials) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  (await cookies()).set(credentialCookie, Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url"), canvaCookieOptions);
}
async function credentials(): Promise<Credentials | null> {
  try {
    const raw = (await cookies()).get(credentialCookie)?.value; if (!raw) return null;
    const bytes = Buffer.from(raw, "base64url"), decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch { return null; }
}
export async function exchangeCanvaToken(params: URLSearchParams) {
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params, signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error("Koneksi Canva gagal. Hubungkan kembali akun Canva.");
  const data = await response.json();
  if (!data.access_token || !data.refresh_token || !data.expires_in) throw new Error("Canva belum memberikan akses lengkap.");
  const stored: Credentials = { access_token: data.access_token, refresh_token: data.refresh_token, expires: Date.now() + data.expires_in * 1000 };
  await saveCanvaCredentials(stored); return stored;
}
async function token() {
  const stored = await credentials(); if (!stored) throw new Error("Hubungkan akun Canva terlebih dahulu.");
  if (stored.expires > Date.now() + 60000) return stored.access_token;
  return (await exchangeCanvaToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: stored.refresh_token }))).access_token;
}
export async function canvaRequest(path: string, body?: unknown) {
  const response = await fetch(`https://api.canva.com/rest/v1/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(response.status === 401 ? "Sesi Canva berakhir. Hubungkan kembali akun Canva." : `Canva menolak permintaan (${response.status}). Periksa akses desain dan paket Canva.`);
  return response.json();
}
export async function canvaStatus() {
  if (!canvaConfigured()) return { ready: false, configured: false, message: "Koneksi Canva belum diatur. Lihat panduan Pengumuman Canva." };
  if (!await credentials()) return { ready: false, configured: true, message: "Hubungkan akun Canva untuk memeriksa desain." };
  return { ready: true, configured: true, message: "Akun Canva terhubung." };
}
export async function validateCanvaFields(fields: Record<string, string>) {
  const result = await canvaRequest(`designs/${CANVA_DESIGN_ID}/dataset`);
  const missing = Object.keys(fields).filter(name => result.dataset?.[name]?.type !== "text");
  if (missing.length) throw new Error(`Field teks Canva belum sesuai: ${missing.join(", ")}. Tambahkan melalui Data Autofill di Canva.`);
}
