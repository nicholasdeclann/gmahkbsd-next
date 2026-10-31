import { getPosterAssignments } from "./sabbathPosters";
import { google, type drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getAccessToken, getDriveService } from "./drive";
import { isFileInDriveFolder } from "./driveFolder";
import { isLocalDemo, readDemo, updateDemo } from "./localDemo";
import { getPhotos, updatePhotoCaption } from "./db";
import {
  ANNOUNCEMENT_IMAGE_TYPES, ANNOUNCEMENT_MAX_BYTES, compareAnnouncements, deriveAnnouncement, isExpired,
  type AnnouncementItem, type AnnouncementPatch,
} from "./announcementTypes";

export class AnnouncementError extends Error {
  constructor(message: string, public status = 503, public code?: string) { super(message); }
}

const directory = path.join(process.cwd(), "work", "announcements");
const marker = "gmahkbsd-announcement";
/** Files written by this version keep their title in the Drive file name. Older files keep a raw filename there. */
const TITLED = "2";
const validDriveId = (value: string) => /^[a-zA-Z0-9_-]{10,200}$/.test(value);
const FILE_FIELDS = "id,name,description,properties,createdTime,imageMediaMetadata(width,height)";

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
  const props = file.properties ?? {};
  return deriveAnnouncement({
    id: file.id!, drive_file_id: file.id!, department: props.department || "Umum",
    title: props.v === TITLED ? file.name : null, caption: file.description || null,
    due_date: props.due || null, created_at: file.createdTime!, image_url: `/api/photos/${file.id}/image`,
    width: file.imageMediaMetadata?.width ?? undefined, height: file.imageMediaMetadata?.height ?? undefined,
  });
}

async function checkedFile(drive: drive_v3.Drive, id: string) {
  if (!validDriveId(id)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  const response = await drive.files.get({ fileId: id, fields: `${FILE_FIELDS},parents,mimeType,size,trashed`, supportsAllDrives: true });
  const file = response.data;
  if (file.trashed || file.properties?.kind !== marker
    || !ANNOUNCEMENT_IMAGE_TYPES.includes(file.mimeType ?? "") || Number(file.size) > ANNOUNCEMENT_MAX_BYTES) {
    throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  }
  if (!(await isFileInDriveFolder(drive, id, file.parents, folderId()))) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  return file;
}

/**
 * List announcements. Expired posts (past their due date, Asia/Jakarta) are hidden unless `includeExpired`
 * is set, which only the admin route does after checking the session.
 */
export async function listAnnouncements(options: { department?: string; includeExpired?: boolean } = {}): Promise<AnnouncementItem[]> {
  const { department, includeExpired = false } = options;
  const visible = (posts: AnnouncementItem[]) => posts
    .filter(p => (!department || p.department === department) && (includeExpired || !p.expired))
    .sort(compareAnnouncements);
  if (isLocalDemo()) return visible((await readDemo()).announcements.map(({ mime_type: _mime, ...post }) => deriveAnnouncement(post)));
  // Preserve existing photos without requiring a database for any new announcement.
  const legacy = process.env.POSTGRES_URL ? (await getPhotos(department)).map(p => deriveAnnouncement({ id: String(p.id), drive_file_id: p.drive_file_id,
    department: p.department, caption: p.caption, due_date: null, created_at: p.created_at,
    image_url: `https://drive.google.com/uc?export=view&id=${encodeURIComponent(p.drive_file_id)}` })) : [];
  if (!announcementStorageConfigured()) return visible(legacy);
  const drive = readDrive();
  const posts: AnnouncementItem[] = [];
  let pageToken: string | undefined;
  do {
    const result = await drive.files.list({ q: `'${folderId()}' in parents and trashed = false and properties has { key='kind' and value='${marker}' }`,
      fields: `nextPageToken,files(${FILE_FIELDS},mimeType,size)`, orderBy: "createdTime desc", pageSize: 100,
      pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true });
    posts.push(...(result.data.files ?? []).filter(f => ANNOUNCEMENT_IMAGE_TYPES.includes(f.mimeType ?? "") && Number(f.size) <= ANNOUNCEMENT_MAX_BYTES).map(item));
    pageToken = result.data.nextPageToken ?? undefined;
  } while (pageToken);
  const seen = new Set(posts.map(p => p.drive_file_id));
  return visible([...posts, ...legacy.filter(p => !seen.has(p.drive_file_id))]);
}

export interface NewAnnouncement { department: string; title: string; caption: string | null; due_date: string }

export async function publishAnnouncement(file: File, details: NewAnnouncement): Promise<AnnouncementItem> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (isLocalDemo()) {
    const id = `local-${randomUUID()}`;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, id), bytes, { flag: "wx" });
    try {
      return await updateDemo(data => {
        const post = { id, drive_file_id: id, department: details.department, title: details.title, caption: details.caption,
          due_date: details.due_date, created_at: new Date().toISOString(), image_url: `/api/photos/${id}/image` };
        data.announcements.push({ ...post, mime_type: file.type }); return deriveAnnouncement(post);
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
  const uploaded = await drive.files.create({ requestBody: { name: details.title, parents: [folderId()], description: details.caption || "",
    properties: { kind: marker, department: details.department, due: details.due_date, v: TITLED } }, media: { mimeType: file.type, body: Readable.from(bytes) },
    fields: FILE_FIELDS, supportsAllDrives: true });
  if (!uploaded.data.id) throw new AnnouncementError("Google Drive belum mengonfirmasi unggahan.", 502);
  // Title, caption, label and due date are created atomically with the file; no second metadata store.
  return item(uploaded.data);
}

export async function editAnnouncement(id: string, patch: AnnouncementPatch): Promise<AnnouncementItem | null> {
  if (patch.due_date !== undefined) {
    const assignments = await getPosterAssignments();
    const date = Object.keys(assignments.assignments).find(date => assignments.assignments[date] === id);
    if (date && patch.due_date < date) throw new AnnouncementError("Tanggal berakhir pengumuman harus pada atau setelah Sabat yang dipilih.", 400);
  }
  if (isLocalDemo()) return updateDemo(data => {
    const post = data.announcements.find(p => p.id === id);
    if (!post) return null;
    if (patch.title !== undefined) post.title = patch.title;
    if (patch.caption !== undefined) post.caption = patch.caption;
    if (patch.due_date !== undefined) post.due_date = patch.due_date;
    if (patch.department !== undefined) post.department = patch.department;
    const { mime_type: _mime, ...result } = post; return deriveAnnouncement(result);
  });
  if (/^\d{1,10}$/.test(id) && process.env.POSTGRES_URL) {
    // Older database-backed posts have nowhere to store a title or due date.
    if (patch.title !== undefined || patch.due_date !== undefined || patch.department !== undefined) {
      throw new AnnouncementError("Pengumuman lama hanya dapat diubah keterangannya.", 400);
    }
    const post = await updatePhotoCaption(Number(id), patch.caption ?? null);
    return post ? deriveAnnouncement({ id: String(post.id), drive_file_id: post.drive_file_id, department: post.department, caption: post.caption, due_date: null,
      created_at: post.created_at, image_url: `https://drive.google.com/uc?export=view&id=${encodeURIComponent(post.drive_file_id)}` }) : null;
  }
  const token = await getAccessToken();
  if (!token) throw new AnnouncementError("Google Drive belum terhubung. Buka Pengaturan.", 401, "DRIVE_NOT_CONNECTED");
  const drive = getDriveService(token);
  await checkedFile(drive, id);
  // Drive merges custom properties key by key, so only the changed keys are sent.
  const properties: Record<string, string> = {};
  const requestBody: drive_v3.Schema$File = {};
  if (patch.title !== undefined) { requestBody.name = patch.title; properties.v = TITLED; }
  if (patch.caption !== undefined) requestBody.description = patch.caption || "";
  if (patch.due_date !== undefined) properties.due = patch.due_date;
  if (patch.department !== undefined) properties.department = patch.department;
  if (Object.keys(properties).length) requestBody.properties = properties;
  const response = await drive.files.update({ fileId: id, requestBody, fields: FILE_FIELDS, supportsAllDrives: true });
  return item(response.data);
}

export interface AnnouncementImage { bytes: Buffer; mime: string; due_date: string | null }

/** Expired posters are only served to staff, so an old shared link stops working once a post comes down. */
export async function announcementImage(id: string, options: { admin?: boolean } = {}): Promise<AnnouncementImage> {
  if (isLocalDemo()) {
    const post = (await readDemo()).announcements.find(p => p.id === id);
    if (!post || !/^local-[a-f0-9-]{36}$/.test(post.drive_file_id)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
    if (!options.admin && isExpired(post.due_date)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
    return { bytes: await readFile(path.join(directory, post.drive_file_id)), mime: post.mime_type, due_date: post.due_date ?? null };
  }
  const drive = readDrive();
  const file = await checkedFile(drive, id);
  const due = file.properties?.due || null;
  if (!options.admin && isExpired(due)) throw new AnnouncementError("Pengumuman tidak ditemukan.", 404);
  const result = await drive.files.get({ fileId: id, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
  return { bytes: Buffer.from(result.data as unknown as ArrayBuffer), mime: file.mimeType!, due_date: due };
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
