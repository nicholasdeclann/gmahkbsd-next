import { sql } from "@vercel/postgres";

if (!process.env.POSTGRES_URL) {
  console.warn(
    "POSTGRES_URL is not set. Database operations will fail. " +
    "Add it to your .env.local file."
  );
}

export interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
  created_at: string;
}

export interface PhotoItem {
  id: number;
  drive_file_id: string;
  department: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

let tableReady = false;
let photoTableReady = false;

/** Create the prayer_items table once per server instance if it doesn't exist. */
export async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS prayer_items (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      note       TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

/** Create the photos table once per server instance if it doesn't exist. */
export async function ensurePhotoTable(): Promise<void> {
  if (photoTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      drive_file_id TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'Sekolah Sabat',
      caption TEXT DEFAULT NULL,
      uploaded_by TEXT DEFAULT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  photoTableReady = true;
}

/** Sunday 00:00 of the current week (local server time), as an ISO string. */
export function currentWeekStart(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString();
}

/** Prayer items created during the current church week (Sunday–Saturday). */
export async function getCurrentWeekItems(): Promise<PrayerItem[]> {
  await ensureTable();
  const { rows } = await sql<PrayerItem>`
    SELECT id, name, note, created_at
    FROM prayer_items
    WHERE created_at >= ${currentWeekStart()}
    ORDER BY created_at ASC
  `;
  return rows;
}

/** All prayer items (for the admin dashboard). */
export async function getAllItems(): Promise<PrayerItem[]> {
  await ensureTable();
  const { rows } = await sql<PrayerItem>`
    SELECT id, name, note, created_at
    FROM prayer_items
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function createItem(
  name: string,
  note: string | null,
): Promise<PrayerItem> {
  await ensureTable();
  const { rows } = await sql<PrayerItem>`
    INSERT INTO prayer_items (name, note)
    VALUES (${name}, ${note})
    RETURNING id, name, note, created_at
  `;
  return rows[0];
}

export async function updateItem(
  id: number,
  name: string,
  note: string | null,
): Promise<PrayerItem | null> {
  await ensureTable();
  const { rows } = await sql<PrayerItem>`
    UPDATE prayer_items
    SET name = ${name}, note = ${note}
    WHERE id = ${id}
    RETURNING id, name, note, created_at
  `;
  return rows[0] ?? null;
}

export async function deleteItem(id: number): Promise<void> {
  await ensureTable();
  await sql`DELETE FROM prayer_items WHERE id = ${id}`;
}

/** Delete every item created before the current week. */
export async function deleteOldItems(): Promise<number> {
  await ensureTable();
  const { rowCount } = await sql`
    DELETE FROM prayer_items WHERE created_at < ${currentWeekStart()}
  `;
  return rowCount ?? 0;
}

// --- Photos ---

/** Get all photos, optionally filtered by department. */
export async function getPhotos(department?: string): Promise<PhotoItem[]> {
  await ensurePhotoTable();
  if (department) {
    const { rows } = await sql<PhotoItem>`
      SELECT id, drive_file_id, department, caption, uploaded_by, created_at
      FROM photos
      WHERE department = ${department}
      ORDER BY created_at DESC
    `;
    return rows;
  }
  const { rows } = await sql<PhotoItem>`
    SELECT id, drive_file_id, department, caption, uploaded_by, created_at
    FROM photos
    ORDER BY created_at DESC
  `;
  return rows;
}

/** Get a single photo by ID. */
export async function getPhotoById(id: number): Promise<PhotoItem | null> {
  await ensurePhotoTable();
  const { rows } = await sql<PhotoItem>`
    SELECT id, drive_file_id, department, caption, uploaded_by, created_at
    FROM photos
    WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

/** Insert a new photo record. */
export async function createPhoto(
  drive_file_id: string,
  department: string,
  uploaded_by: string | null,
): Promise<PhotoItem> {
  await ensurePhotoTable();
  const { rows } = await sql<PhotoItem>`
    INSERT INTO photos (drive_file_id, department, uploaded_by)
    VALUES (${drive_file_id}, ${department}, ${uploaded_by})
    RETURNING id, drive_file_id, department, caption, uploaded_by, created_at
  `;
  return rows[0];
}

/** Update a photo's caption. */
export async function updatePhotoCaption(
  id: number,
  caption: string | null
): Promise<PhotoItem | null> {
  await ensurePhotoTable();
  const { rows } = await sql<PhotoItem>`
    UPDATE photos
    SET caption = ${caption}
    WHERE id = ${id}
    RETURNING id, drive_file_id, department, caption, uploaded_by, created_at
  `;
  return rows[0] ?? null;
}

/** Delete a photo record. */
export async function deletePhoto(id: number): Promise<void> {
  await ensurePhotoTable();
  await sql`DELETE FROM photos WHERE id = ${id}`;
}
