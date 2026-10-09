import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WeeklyValues } from "./kertasAcaraForm";
import type { AnnouncementItem } from "./announcementTypes";

export function isLocalDemo(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DASHBOARD_DEMO_MODE === "true";
}

// Connect the weekly form without switching unfinished prayer/photo adapters out of practice mode.
export function isWeeklyDemo(): boolean {
  return isLocalDemo() && process.env.GOOGLE_SHEETS_LIVE_MODE !== "true";
}

export interface DemoPrayer {
  id: number; name: string; note: string | null; note_public: boolean; created_at: string;
}
export interface DemoAnnouncement extends AnnouncementItem { mime_type: string }
export interface DemoData { weekly: WeeklyValues; prayers: DemoPrayer[]; nextPrayerId: number; announcements: DemoAnnouncement[] }
const directory = path.join(process.cwd(), "work");
const filename = path.join(directory, "dashboard-demo.json");
let pending: Promise<unknown> = Promise.resolve();

function seed(): DemoData {
  return {
    weekly: { date: "2026-10-10", sermonTitle: "", mainVerse: "", responsiveReading: "",
      openingHymn: "", closingHymn: "", ssOpeningHymn: "79", ssClosingHymn: "186" },
    prayers: [], nextPrayerId: 1, announcements: [],
  };
}

export async function readDemo(): Promise<DemoData> {
  if (!isLocalDemo()) throw new Error("Demo hanya tersedia pada server pengembangan lokal.");
  try {
    const data = JSON.parse(await readFile(filename, "utf8")) as DemoData;
    data.announcements ??= [];
    return data;
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return seed();
  }
}

/** Serialize local saves and replace the JSON file atomically. Never used on Vercel. */
export function updateDemo<T>(update: (data: DemoData) => T): Promise<T> {
  const operation = pending.then(async () => {
    const data = await readDemo();
    const result = update(data);
    await mkdir(directory, { recursive: true });
    const temporary = `${filename}.tmp`;
    await writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
    await rename(temporary, filename);
    return result;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
