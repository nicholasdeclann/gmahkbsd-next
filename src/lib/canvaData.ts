import { createHash } from "node:crypto";
import { getSheetSources } from "./sheetSettings";
import { parseQuarterlySchedule } from "./quarterlySchedule";
import { readPrayerSheet } from "./prayerSheet";
import { listAnnouncements } from "./announcements";
import { announcementDates, buildCanvaPreview } from "./canvaPreview";

export async function loadCanvaPreview() {
  const { current, next } = announcementDates();
  const { sheetId, quarterlyScheduleGid } = (await getSheetSources()).liturgy;
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.search = new URLSearchParams({ gid: quarterlyScheduleGid, range: "B4:CZ33", headers: "0", tqx: "out:json" }).toString();
  const schedule = fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) }).then(async response => {
    if (!response.ok) throw new Error("Schedule unavailable");
    // Anchor parsing to the target Saturday, including quarter/year boundaries.
    return parseQuarterlySchedule(await response.text(), new Date(`${next}T12:00:00Z`));
  }).catch(() => null);
  const [prayer, participants, announcements] = await Promise.all([readPrayerSheet(), schedule, listAnnouncements()]);
  const preview = buildCanvaPreview(current, prayer, participants, announcements);
  return { ...preview, revision: createHash("sha256").update(JSON.stringify(preview)).digest("hex"), demo: prayer.mode === "demo" };
}
