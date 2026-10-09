import { NextResponse } from "next/server";
import { isAuthenticated } from "./adminAuth";

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  if (!origin) return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
  try {
    // Next.js may normalize request.url to localhost behind its dev proxy.
    // The browser-facing Host preserves 127.0.0.1 / the actual deployment host.
    const expected = new URL(request.url);
    expected.host = request.headers.get("host") ?? expected.host;
    return new URL(origin).origin === expected.origin;
  } catch { return false; }
}

export async function adminRequestError(request?: Request): Promise<NextResponse | null> {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Silakan masuk kembali.", code: "ADMIN_REQUIRED" }, { status: 401 });
  if (request && !isSameOrigin(request)) return NextResponse.json({ error: "Permintaan tidak diizinkan." }, { status: 403 });
  return null;
}
