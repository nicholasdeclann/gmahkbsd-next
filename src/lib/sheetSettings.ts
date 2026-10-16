import "server-only";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { createOAuthClient } from "./drive";
import { isLocalDemo, readDemo, updateDemo } from "./localDemo";
import { defaultSheetSources, validSources, type SheetSources } from "./sheetSources";

interface StoredSettings { version: 1; sources: SheetSources; previous?: SheetSources; updatedAt: string }
const kind = "gmahkbsd-sheet-settings";
export const settingsRevision = (sources: SheetSources) => createHash("sha256").update(JSON.stringify(sources)).digest("hex");
function driveClient() {
  if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) throw new Error("Koneksi bersama Google Drive belum tersedia. Hubungi pengelola website.");
  const client = createOAuthClient(); client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: client });
}
async function stored() {
  if (isLocalDemo()) return { data: (await readDemo()).sheetSettings as StoredSettings | undefined, id: undefined };
  // Existing installations continue to use their configured defaults until the first save.
  if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) return { data: undefined, id: undefined };
  const drive = driveClient();
  const result = await drive.files.list({ q: `trashed=false and 'root' in parents and properties has {key='kind' and value='${kind}'}`, fields: "files(id)", orderBy: "createdTime", pageSize: 2 });
  if ((result.data.files?.length ?? 0) > 1) throw new Error("Ada pengaturan spreadsheet ganda di Drive. Hubungi pengelola website.");
  const id = result.data.files?.[0]?.id;
  if (!id) return { data: undefined, id: undefined };
  const response = await drive.files.get({ fileId: id, alt: "media" }, { responseType: "text" });
  const data = JSON.parse(String(response.data)) as StoredSettings;
  if (data.version !== 1 || !validSources(data.sources) || (data.previous && !validSources(data.previous))) throw new Error("Pengaturan spreadsheet di Drive tidak valid.");
  return { data, id };
}
export async function getSheetSettings() {
  const { data } = await stored(); const sources = data?.sources ?? defaultSheetSources;
  return { sources, previous: data?.previous, revision: settingsRevision(sources), updatedAt: data?.updatedAt, demo: isLocalDemo() };
}
// Short cache for public readers; staff reads and writes always resolve the saved source.
let cache: { sources: SheetSources; expires: number } | undefined;
export async function getSheetSources() {
  if (cache && cache.expires > Date.now()) return cache.sources;
  const { sources } = await getSheetSettings(); cache = { sources, expires: Date.now() + 15000 }; return sources;
}
let queue: Promise<unknown> = Promise.resolve();
export async function saveSheetSettings(sources: SheetSources, expected: string) {
  const operation = queue.then(async () => {
    const current = await getSheetSettings();
    if (current.revision !== expected) throw new Error("Pengaturan sudah diubah. Muat ulang halaman sebelum menyimpan.");
    if (!validSources(sources)) throw new Error("Sumber spreadsheet tidak valid.");
    if (settingsRevision(sources) === current.revision) return current;
    const data: StoredSettings = { version: 1, sources, previous: current.sources, updatedAt: new Date().toISOString() };
    if (isLocalDemo()) await updateDemo(demo => { demo.sheetSettings = data; });
    else {
      const drive = driveClient(), { id } = await stored();
      const media = { mimeType: "application/json", body: Readable.from([JSON.stringify(data)]) };
      if (id) await drive.files.update({ fileId: id, media });
      else await drive.files.create({ requestBody: { name: "Pengaturan Spreadsheet GMAHK BSD.json", mimeType: "application/json", properties: { kind } }, media, fields: "id" });
    }
    cache = undefined;
    return getSheetSettings();
  });
  queue = operation.catch(() => undefined); return operation;
}
