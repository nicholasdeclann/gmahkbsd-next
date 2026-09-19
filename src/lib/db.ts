import { sql } from "@vercel/postgres";

export interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
  created_at: string;
}

let tableReady = false;

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
