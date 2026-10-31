import { google } from "googleapis";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { getAccessToken, getDriveService } from "./drive";
import { isLocalDemo, readDemo, updateDemo } from "./localDemo";
import { changePoster, posterDate, type PosterAssignments } from "./sabbathPosterTypes";

const kind = "gmahkbsd-sabbath-posters";
const pointer = "gmahkbsdPosterMap";
function etagOf(headers: unknown): string | null {
  const value = headers as { get?: (name: string) => string | null; etag?: string };
  return typeof value.get === "function" ? value.get("etag") : value.etag ?? null;
}
const empty = (): PosterAssignments => ({ version: 1, revision: "0", assignments: {} });
export class PosterError extends Error { constructor(message: string, public status = 502) { super(message); } }
function reader() {
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new PosterError("Penetapan poster belum dapat dimuat. Periksa koneksi Google di Pengaturan.");
  return google.drive({ version: "v3", auth: new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), scopes: ["https://www.googleapis.com/auth/drive.readonly"] }) });
}
async function readState(drive = reader()) {
  // Anchor the singleton map in a shared folder property. Conditional folder updates
  // let competing first-time writers create candidates, but only publish one map.
  const folder = await drive.files.get({ fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!, fields: "id,properties", supportsAllDrives: true });
  const folderEtag = etagOf(folder.headers), id = folder.data.properties?.[pointer];
  if (!id) return { state: empty(), id: null, etag: null as string | null, folderEtag };
  const response = await drive.files.get({ fileId: id, alt: "media", supportsAllDrives: true }, { responseType: "text" });
  const state = JSON.parse(String(response.data)) as PosterAssignments;
  if (state.version !== 1 || typeof state.revision !== "string" || !state.assignments || Array.isArray(state.assignments) || typeof state.assignments !== "object") throw new PosterError("Penetapan poster tidak valid. Hubungi pengelola website.");
  for (const [date, post] of Object.entries(state.assignments)) { posterDate(date); if (typeof post !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(post)) throw new PosterError("Penetapan poster tidak valid."); }
  return { state, id, etag: etagOf(response.headers), folderEtag };
}
export async function getPosterAssignments(): Promise<PosterAssignments> {
  return isLocalDemo() ? (await readDemo()).sabbathPosters ?? empty() : (await readState()).state;
}
export async function assignPoster(date: string, id: string | null, expected: string) {
  if (isLocalDemo()) return updateDemo(data => {
    try { return data.sabbathPosters = changePoster(data.sabbathPosters ?? empty(), expected, date, id, randomUUID()); }
    catch (error) { throw new PosterError((error as Error).message, 409); }
  });
  const token = await getAccessToken();
  if (!token) throw new PosterError("Google Drive belum terhubung. Buka Pengaturan.", 401);
  const drive = getDriveService(token);
  const stored = await readState(drive);
  let state: PosterAssignments;
  try { state = changePoster(stored.state, expected, date, id, randomUUID()); }
  catch (error) { throw new PosterError((error as Error).message, 409); }
  const media = { mimeType: "application/json", body: Readable.from([JSON.stringify(state)]) };
  try {
    if (stored.id) {
      if (!stored.etag) throw new PosterError("Revisi Google Drive belum tersedia. Refresh lalu coba lagi.");
      await drive.files.update({ fileId: stored.id, media, supportsAllDrives: true }, { headers: { "If-Match": stored.etag } });
    } else {
      if (!stored.folderEtag) throw new PosterError("Revisi Google Drive belum tersedia. Refresh lalu coba lagi.");
      const created = await drive.files.create({ requestBody: { name: "GMAHK BSD - Kertas Acara posters.json", parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!], properties: { kind } }, media, fields: "id", supportsAllDrives: true });
      if (!created.data.id) throw new PosterError("Google Drive belum mengonfirmasi penetapan poster.");
      try {
        await drive.files.update({ fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!, requestBody: { properties: { [pointer]: created.data.id } }, supportsAllDrives: true }, { headers: { "If-Match": stored.folderEtag } });
      } catch (error) {
        // A timeout may follow a successful commit. Only a definitive precondition
        // failure proves this candidate was not published; otherwise retain it.
        if ((error as { response?: { status?: number } }).response?.status === 412) {
          await drive.files.update({ fileId: created.data.id, requestBody: { trashed: true }, supportsAllDrives: true }).catch(() => undefined);
        }
        throw error;
      }
    }
    const checked = await readState(drive);
    if (checked.state.revision !== state.revision) throw new PosterError("Penetapan poster telah berubah. Refresh lalu coba lagi.", 409);
    return state;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 412) throw new PosterError("Penetapan poster telah berubah. Refresh lalu coba lagi.", 409);
    throw error;
  }
}
