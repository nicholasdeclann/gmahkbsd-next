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
async function step<T>(stage: string, action: () => Promise<T>): Promise<T> {
  try { return await action(); } catch (error) { if (error && typeof error === "object") Object.assign(error, { posterStage: stage }); throw error; }
}
async function readState() {
  const drive = reader();
  let id = process.env.GOOGLE_SABBATH_POSTER_MAP_ID;
  let configured = Boolean(id);
  if (!id) {
    const folder = await step("read-folder", () => drive.files.get({ fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!, fields: "id,properties", supportsAllDrives: true }));
    id = folder.data.properties?.[pointer] ?? undefined;
    configured = Boolean(id);
  }
  if (!id) {
    const candidates = await step("find-registry", () => drive.files.list({q: "'" + process.env.GOOGLE_DRIVE_FOLDER_ID + "' in parents and trashed=false and properties has {key='kind' and value='" + kind + "'}", fields:"files(id)",orderBy:"createdTime",pageSize:1,supportsAllDrives:true,includeItemsFromAllDrives:true}));
    id = candidates.data.files?.[0]?.id ?? undefined;
  }
  if (!id) return { state: empty(), id: null, etag: null as string | null, configured:false };
  const metadata = await step("registry-metadata", () => drive.files.get({fileId:id!,fields:"id",supportsAllDrives:true}));
  const response = await step("read-registry", () => drive.files.get({ fileId: id!, alt: "media", supportsAllDrives: true }, { responseType: "text" }));
  const state = JSON.parse(String(response.data)) as PosterAssignments;
  if (state.version !== 1 || typeof state.revision !== "string" || !state.assignments || Array.isArray(state.assignments) || typeof state.assignments !== "object") throw new PosterError("Penetapan poster tidak valid. Hubungi pengelola website.");
  for (const [date, post] of Object.entries(state.assignments)) { posterDate(date); if (typeof post !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(post)) throw new PosterError("Penetapan poster tidak valid."); }
  return { state, id, etag: etagOf(metadata.headers), configured };
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
  const stored = await readState();
  if (!stored.configured) {
    let registryId = stored.id;
    if (!registryId) {
      const created = await step("create-registry", () => drive.files.create({ requestBody: { name: "GMAHK BSD - Kertas Acara posters.json", parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!], properties: { kind } }, media: { mimeType: "application/json", body: Readable.from([JSON.stringify(empty())]) }, fields: "id", supportsAllDrives: true }));
      registryId = created.data.id ?? null;
    }
    if (!registryId) throw new PosterError("Google Drive belum mengonfirmasi penetapan poster.");
    console.info("Sabbath poster registry setup", { registryId });
    throw new PosterError("Penyimpanan poster perlu disiapkan oleh pengelola website.", 503);
  }
  let state: PosterAssignments;
  try { state = changePoster(stored.state, expected, date, id, randomUUID()); }
  catch (error) { throw new PosterError((error as Error).message, 409); }
  const media = { mimeType: "application/json", body: Readable.from([JSON.stringify(state)]) };
  try {
    if (stored.id) {
      if (!stored.etag) throw new PosterError("Revisi Google Drive belum tersedia. Refresh lalu coba lagi.");
      await drive.files.update({ fileId: stored.id, media, supportsAllDrives: true }, { headers: { "If-Match": stored.etag } });
    }
    const checked = await readState();
    if (checked.state.revision !== state.revision) throw new PosterError("Penetapan poster telah berubah. Refresh lalu coba lagi.", 409);
    return state;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 412) throw new PosterError("Penetapan poster telah berubah. Refresh lalu coba lagi.", 409);
    throw error;
  }
}
