import { google, type drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getAccessToken, getDriveService } from "./drive";
import { isFileInDriveFolder } from "./driveFolder";
import { isLocalDemo, readDemo, updateDemo } from "./localDemo";
import { getPhotos, updatePhotoCaption } from "./db";
import { ANNOUNCEMENT_IMAGE_TYPES, ANNOUNCEMENT_MAX_BYTES, type AnnouncementItem } from "./announcementTypes";

export class AnnouncementError extends Error {
  constructor(message: string, public status = 503, public code?: string) { super(message); }
}

const directory = path.join(process.cwd(), "work", "announcements");
const marker = "gmahkbsd-announcement";
const validDriveId = (value: string) => /^[a-zA-Z0-9_-]{10,200}$/.test(value);

export function announcementStorageConfigured() {
  return Boolean(isLocalDemo() || (process.env.GOOGLE_DRIVE_FOLDER_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON));
}

function readDrive() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !process.env.GOOGLE_DRIVE_FOLDER_ID) throw new AnnouncementError("Folder pengumuman dan akses Google Drive belum diatur. Hubungi pengelola website.");
  const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  return google.drive({ version: "v3", auth });
}

const folderId = () => {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "";
  if (!validDriveId(id)) throw new AnnouncementError("Folder pengumuman belum diatur.");
  return id;
};

function item(file: drive_v3.Schema$File): AnnouncementItem {
  return { id: file.id!, drive_file_id: file.id!, department: file.properties?.department || "Umum",
    caption: file.description || null, created_at: file.createdTime!, image_url: `/api/photos/${file.id}/image` };
}

async function checkedFile(drive: drive_v3.Drive, id: string) {
  if (!validDriveId(id)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  const response = await drive.files.get({ fileId: id, fields: "id,description,properties,createdTime,parents,mimeType,size,trashed", supportsAllDrives: true });
  const file = response.data;
  if (file.trashed || file.properties?.kind !== marker
    || !ANNOUNCEMENT_IMAGE_TYPES.includes(file.mimeType ?? "") || Number(file.size) > ANNOUNCEMENT_MAX_BYTES) {
    throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  }
  if (!(await isFileInDriveFolder(drive, id, file.parents, folderId()))) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  return file;
}

export async function listAnnouncements(department?: string): Promise<AnnouncementItem[]> {
  if (isLocalDemo()) return (await readDemo()).announcements.filter(p => !department || p.department === department).map(({ mime_type: _mime, ...post }) => post).reverse();
  // Preserve existing photos without requiring a database for any new announcement.
  const legacy = process.env.POSTGRES_URL ? (await getPhotos(department)).map(p => ({ id: String(p.id), drive_file_id: p.drive_file_id,
    department: p.department, caption: p.caption, created_at: p.created_at,
    image_url: `https://drive.google.com/uc?export=view&id=${encodeURIComponent(p.drive_file_id)}` })) : [];
  if (!announcementStorageConfigured()) return legacy;
  const drive = readDrive();
  const posts: AnnouncementItem[] = [];
  let pageToken: string | undefined;
  do {
    const result = await drive.files.list({ q: `'${folderId()}' in parents and trashed = false and properties has { key='kind' and value='${marker}' }`,
      fields: "nextPageToken,files(id,description,properties,createdTime,mimeType,size)", orderBy: "createdTime desc", pageSize: 100,
      pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true });
    posts.push(...(result.data.files ?? []).filter(f => ANNOUNCEMENT_IMAGE_TYPES.includes(f.mimeType ?? "") && Number(f.size) <= ANNOUNCEMENT_MAX_BYTES).map(item));
    pageToken = result.data.nextPageToken ?? undefined;
  } while (pageToken);
  const seen = new Set(posts.map(p => p.drive_file_id));
  return [...posts.filter(p => !department || p.department === department), ...legacy.filter(p => !seen.has(p.drive_file_id))]
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function publishAnnouncement(file: File, department: string, caption: string | null): Promise<AnnouncementItem> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (isLocalDemo()) {
    const id = `local-${randomUUID()}`;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, id), bytes, { flag: "wx" });
    try {
      return await updateDemo(data => {
        const post = { id, drive_file_id: id, department, caption, created_at: new Date().toISOString(), image_url: `/api/photos/${id}/image` };
        data.announcements.push({ ...post, mime_type: file.type }); return post;
      });
    } catch (error) { await unlink(path.join(directory, id)); throw error; }
  }
  if (!announcementStorageConfigured()) throw new AnnouncementError("Folder pengumuman dan akses Drive belum diatur. Buka Pengaturan.");
  // Check the public reader before uploading; prevent publishing an unreadable board.
  const readableFolder = await readDrive().files.get({ fileId: folderId(), fields: "id,mimeType", supportsAllDrives: true });
  if (readableFolder.data.mimeType !== "application/vnd.google-apps.folder") throw new AnnouncementError("Folder pengumuman tidak valid.");
  const token = await getAccessToken();
  if (!token) throw new AnnouncementError("Google Drive belum terhubung. Buka Pengaturan.", 401, "DRIVE_NOT_CONNECTED");
  const drive = getDriveService(token);
  const uploaded = await drive.files.create({ requestBody: { name: file.name, parents: [folderId()], description: caption || "",
    properties: { kind: marker, department } }, media: { mimeType: file.type, body: Readable.from(bytes) },
    fields: "id,description,properties,createdTime", supportsAllDrives: true });
  if (!uploaded.data.id) throw new AnnouncementError("Google Drive belum mengonfirmasi unggahan.", 502);
  // Caption and label are created atomically with the file; no second metadata store.
  return item(uploaded.data);
}

export async function editAnnouncement(id: string, caption: string | null): Promise<AnnouncementItem | null> {
  if (isLocalDemo()) return updateDemo(data => {
    const post = data.announcements.find(p => p.id === id);
    if (!post) return null;
    post.caption = caption;
    const { mime_type: _mime, ...result } = post; return result;
  });
  if (/^\d{1,10}$/.test(id) && process.env.POSTGRES_URL) {
    const post = await updatePhotoCaption(Number(id), caption);
    return post ? { id: String(post.id), drive_file_id: post.drive_file_id, department: post.department, caption: post.caption,
      created_at: post.created_at, image_url: `https://drive.google.com/uc?export=view&id=${encodeURIComponent(post.drive_file_id)}` } : null;
  }
  const token = await getAccessToken();
  if (!token) throw new AnnouncementError("Google Drive belum terhubung. Buka Pengaturan.", 401, "DRIVE_NOT_CONNECTED");
  const drive = getDriveService(token);
  await checkedFile(drive, id);
  const response = await drive.files.update({ fileId: id, requestBody: { description: caption || "" }, fields: "id,description,properties,createdTime", supportsAllDrives: true });
  return item(response.data);
}

export async function announcementImage(id: string) {
  if (isLocalDemo()) {
    const post = (await readDemo()).announcements.find(p => p.id === id);
    if (!post || !/^local-[a-f0-9-]{36}$/.test(post.drive_file_id)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
    return { bytes: await readFile(path.join(directory, post.drive_file_id)), mime: post.mime_type };
  }
  const drive = readDrive();
  const file = await checkedFile(drive, id);
  const result = await drive.files.get({ fileId: id, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
  return { bytes: Buffer.from(result.data as unknown as ArrayBuffer), mime: file.mimeType! };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isLocalDemo()) {
    if (!/^local-[a-f0-9-]{36}$/.test(id)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
    await updateDemo(async data => {
      const post = data.announcements.find(p => p.id === id);
      if (!post) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
      await unlink(path.join(directory, id)).catch(error => { if (error.code !== "ENOENT") throw error; });
      data.announcements = data.announcements.filter(p => p.id !== id);
    });
    return;
  }
  const token = await getAccessToken();
  if (!token) throw new AnnouncementError("Google Drive belum terhubung. Buka Pengaturan.", 401, "DRIVE_NOT_CONNECTED");
  const drive = getDriveService(token);
  await checkedFile(drive, id);
  // Trashing the file removes both the board entry and its image in one operation.
  await drive.files.update({ fileId: id, requestBody: { trashed: true }, supportsAllDrives: true });
}
