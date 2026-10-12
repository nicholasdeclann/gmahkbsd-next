import { google, type drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { getAccessToken, getDriveService } from "./drive";
import { isLocalDemo, readDemo, updateDemo } from "./localDemo";
import { EVENT_IMAGE_TYPES, EVENT_MAX_BYTES, validMonth, type EventPhoto } from "./eventTypes";

const kind = "gmahkbsd-event";
const tag = "church-events";
const directory = path.join(process.cwd(), "work", "events");
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export class EventError extends Error { constructor(message: string, public status = 503) { super(message); } }
export function eventsConfigured() { return isLocalDemo() || Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID); }
const validId = (id: string) => /^[a-zA-Z0-9_-]{10,200}$/.test(id);
function reader() {
  if (!eventsConfigured()) throw new EventError("Akses Google Drive belum diatur. Hubungi pengelola website.");
  return google.drive({ version: "v3", auth: new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!), scopes: ["https://www.googleapis.com/auth/drive.readonly"] }) });
}
async function writer() {
  const token = await getAccessToken();
  if (!token) throw new EventError("Google Drive belum terhubung. Buka Pengaturan.", 503);
  return getDriveService(token);
}
function item(file: drive_v3.Schema$File): EventPhoto {
  return { id: file.id!, title: file.description?.split("\n")[0]?.replace(/^Kegiatan: /, "") || "Kegiatan Jemaat",
    caption: file.description?.split("\n").slice(1).join("\n") || "", eventDate: file.properties?.eventDate || "",
    published: file.properties?.published === "true", imageUrl: `/api/events/${file.id}/image` };
}
// Captions and full titles live in description; short indexed fields live in properties.
function metadata(details: Omit<EventPhoto, "id" | "imageUrl">) {
  return { description: `Kegiatan: ${details.title}\n${details.caption}`, properties: { kind, eventDate: details.eventDate, published: String(details.published) } };
}
const folderOperations = new Map<string, Promise<string | null>>();
async function folder(drive: drive_v3.Drive, parent: string, key: string, name: string, create: boolean): Promise<string | null> {
  if (!create) return findFolder(drive,parent,key,name,false);
  const identity = `${parent}:${key}`;
  const pending = folderOperations.get(identity);
  if (pending) return pending;
  const operation = findFolder(drive,parent,key,name,true);
  folderOperations.set(identity,operation);
  try {return await operation;} finally {folderOperations.delete(identity);}
}
async function findFolder(drive: drive_v3.Drive, parent: string, key: string, name: string, create: boolean): Promise<string | null> {
  if (!validId(parent)) throw new EventError("Folder kegiatan tidak valid.");
  const result = await drive.files.list({ q: `'${parent}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder' and properties has {key='eventFolder' and value='${key}'}`,
    fields: "files(id)", pageSize: 100, orderBy: "createdTime", supportsAllDrives: true, includeItemsFromAllDrives: true });
  const found = result.data.files?.[0]?.id;
  if (found || !create) return found || null;
  const created = await drive.files.create({ requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent], properties: { eventFolder: key } }, fields: "id", supportsAllDrives: true });
  if (!created.data.id) throw new EventError("Folder kegiatan belum berhasil dibuat.");
  // Reconcile another server creating the same month concurrently: use the oldest matching folder.
  return (await findFolder(drive,parent,key,name,false)) || created.data.id;
}
async function root(drive: drive_v3.Drive, create = false) {
  const configured = process.env.GOOGLE_EVENTS_FOLDER_ID;
  if (configured) { if (!validId(configured)) throw new EventError("Folder kegiatan tidak valid."); return configured; }
  return folder(drive, process.env.GOOGLE_DRIVE_FOLDER_ID!, "root", "Kegiatan Jemaat", create);
}
async function monthFolder(drive: drive_v3.Drive, month: string, create = false) {
  const rootId = await root(drive, create);
  if (!rootId) return null;
  const yearId = await folder(drive, rootId, month.slice(0, 4), month.slice(0, 4), create);
  if (!yearId) return null;
  return folder(drive, yearId, month, `${month.slice(5)} - ${months[Number(month.slice(5)) - 1]}`, create);
}
async function checked(drive: drive_v3.Drive, id: string) {
  if (!validId(id)) throw new EventError("Foto tidak ditemukan.", 404);
  const response = await drive.files.get({ fileId: id, fields: "id,description,properties,parents,mimeType,size,trashed", supportsAllDrives: true });
  const file = response.data;
  const month = file.properties?.eventDate?.slice(0, 7) || "";
  if (file.trashed || file.properties?.kind !== kind || !validMonth(month) || !EVENT_IMAGE_TYPES.includes(file.mimeType || "") || Number(file.size) > EVENT_MAX_BYTES) throw new EventError("Foto tidak ditemukan.", 404);
  const parent = await monthFolder(drive, month);
  if (!parent) throw new EventError("Foto tidak ditemukan.", 404);
  // Verify through a listing too: Drive can omit parents for link-shared files.
  if (!file.parents?.includes(parent)) {
    const found = await drive.files.list({ q: `'${parent}' in parents and trashed=false and properties has {key='kind' and value='${kind}'}`, fields: "nextPageToken,files(id)", pageSize: 100, supportsAllDrives: true, includeItemsFromAllDrives: true });
    let files = found.data;
    while (!files.files?.some(f => f.id === id) && files.nextPageToken) files = (await drive.files.list({ q: `'${parent}' in parents and trashed=false and properties has {key='kind' and value='${kind}'}`, fields: "nextPageToken,files(id)", pageToken: files.nextPageToken, pageSize: 100, supportsAllDrives: true, includeItemsFromAllDrives: true })).data;
    if (!files.files?.some(f => f.id === id)) throw new EventError("Foto tidak ditemukan.", 404);
  }
  return { file, parent };
}
export async function listEvents(month: string, admin: boolean, pageToken?: string, limit = 100) {
  if (!validMonth(month)) throw new EventError("Bulan tidak valid.", 400);
  if (isLocalDemo()) {
    const photos = (await readDemo()).events?.filter(p => p.eventDate.startsWith(month) && (admin || p.published)).sort((a,b) => b.eventDate.localeCompare(a.eventDate) || a.id.localeCompare(b.id)) || [];
    const offset = pageToken ? Number(pageToken) : 0;
    if (!Number.isSafeInteger(offset) || offset < 0) throw new EventError("Halaman tidak valid.", 400);
    return { photos: photos.slice(offset, offset + limit).map(({mime: _mime, ...photo}) => photo), nextPageToken: offset + limit < photos.length ? String(offset + limit) : null };
  }
  const drive = reader(), parent = await monthFolder(drive, month);
  if (!parent) return { photos: [], nextPageToken: null };
  const result = await drive.files.list({ q: `'${parent}' in parents and trashed=false and properties has {key='kind' and value='${kind}'}${admin ? "" : " and properties has {key='published' and value='true'}"}`,
    fields: "nextPageToken,files(id,description,properties,mimeType,size)", pageSize: limit, pageToken, orderBy: "createdTime desc", supportsAllDrives: true, includeItemsFromAllDrives: true });
  return { photos: (result.data.files || []).filter(f => EVENT_IMAGE_TYPES.includes(f.mimeType || "") && Number(f.size) <= EVENT_MAX_BYTES && f.properties?.eventDate?.startsWith(month)).map(item).sort((a,b) => b.eventDate.localeCompare(a.eventDate)), nextPageToken: result.data.nextPageToken || null };
}
export const cachedEvents = unstable_cache((month: string, pageToken?: string, limit = 100) => listEvents(month, false, pageToken, limit), [tag], { revalidate: 60, tags: [tag] });
function changed() { revalidateTag(tag); }
export async function uploadEvent(file: File, details: Omit<EventPhoto, "id" | "imageUrl">) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = file.type === "image/jpeg" ? bytes.subarray(0,3).equals(Buffer.from([255,216,255])) : file.type === "image/png" ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
  if (!image) throw new EventError("File gambar tidak valid.", 400);
  if (isLocalDemo()) {
    const id = `local-${randomUUID()}`; await mkdir(directory, { recursive: true }); await writeFile(path.join(directory, id), bytes, { flag: "wx" });
    try { return await updateDemo(data => { const photo = { ...details, id, imageUrl: `/api/events/${id}/image` }; (data.events ??= []).push({ ...photo, mime: file.type }); return photo; }); }
    catch(error) { await unlink(path.join(directory,id)); throw error; }
  }
  const drive = await writer(), parent = await monthFolder(drive, details.eventDate.slice(0,7), true);
  // Refuse publication if the existing website reader cannot access the folder.
  await reader().files.get({ fileId: parent!, fields: "id", supportsAllDrives: true });
  const result = await drive.files.create({ requestBody: { name: file.name, parents: [parent!], ...metadata(details) }, media: { mimeType: file.type, body: Readable.from(bytes) }, fields: "id,description,properties", supportsAllDrives: true });
  if (!result.data.id) throw new EventError("Google Drive belum mengonfirmasi unggahan.", 502);
  changed(); return item(result.data);
}
export async function editEvent(id: string, details: Omit<EventPhoto,"id"|"imageUrl">) {
  if (isLocalDemo()) return updateDemo(data => { const photo = data.events?.find(p => p.id === id); if (!photo) throw new EventError("Foto tidak ditemukan.",404); Object.assign(photo, details); const {mime: _mime, ...result} = photo; return result; });
  const drive = await writer(), current = await checked(drive,id), destination = await monthFolder(drive, details.eventDate.slice(0,7),true);
  await reader().files.get({fileId: destination!, fields: "id", supportsAllDrives:true});
  const result = await drive.files.update({fileId: id, requestBody: metadata(details), ...(destination !== current.parent ? {addParents: destination!, removeParents: current.parent} : {}), fields: "id,description,properties", supportsAllDrives:true});
  changed(); return item(result.data);
}
export async function deleteEvent(id: string) {
  if (isLocalDemo()) return updateDemo(async data => { const photo = data.events?.find(p => p.id === id); if (!photo || !/^local-[a-f0-9-]{36}$/.test(id)) throw new EventError("Foto tidak ditemukan.",404); await unlink(path.join(directory,id)); data.events = data.events!.filter(p => p.id !== id); });
  const drive = await writer(); await checked(drive,id); await drive.files.update({fileId:id,requestBody:{trashed:true},supportsAllDrives:true}); changed();
}
export async function eventImage(id: string, admin: boolean) {
  if (isLocalDemo()) { const photo = (await readDemo()).events?.find(p => p.id === id && (admin || p.published)); if (!photo || !/^local-[a-f0-9-]{36}$/.test(id)) throw new EventError("Foto tidak ditemukan.",404); return {bytes: await readFile(path.join(directory,id)), mime: photo.mime}; }
  const drive = reader(), {file} = await checked(drive,id);
  if (!admin && file.properties?.published !== "true") throw new EventError("Foto tidak ditemukan.",404);
  const response = await drive.files.get({fileId:id,alt:"media",supportsAllDrives:true},{responseType:"arraybuffer"});
  return {bytes:Buffer.from(response.data as unknown as ArrayBuffer),mime:file.mimeType!};
}
