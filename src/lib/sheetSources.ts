import { churchConfig } from "@/config/church";

export interface SheetSources {
  liturgy: { sheetId: string; kertasAcaraGid: string; laguSionGid: string; quarterlyScheduleGid: string };
  schedule: { sheetId: string; gid: string };
}
export const defaultSheetSources: SheetSources = {
  liturgy: { ...churchConfig.sheets.liturgy }, schedule: { ...churchConfig.sheets.schedule },
};
export function sheetLink(id: string, gid: string) { return `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}`; }
export function parseSheetLink(input: unknown) {
  if (typeof input !== "string" || input.length > 1500) throw new Error("Tempel tautan Google Sheets yang valid.");
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error("Tempel tautan lengkap Google Sheets."); }
  const match = /^\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,200})(?:\/|$)/.exec(url.pathname);
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com" || !match) throw new Error("Gunakan tautan dari docs.google.com/spreadsheets.");
  const gid = new URLSearchParams(url.hash.slice(1)).get("gid") ?? url.searchParams.get("gid");
  if (gid !== null && !/^\d{1,12}$/.test(gid)) throw new Error("Tab spreadsheet tidak valid.");
  return { sheetId: match[1], gid };
}
export function validSources(value: unknown): value is SheetSources {
  const v = value as SheetSources | undefined;
  return Boolean(v?.liturgy && v.schedule && [v.liturgy.sheetId, v.schedule.sheetId].every(id => typeof id === "string" && /^[a-zA-Z0-9_-]{10,200}$/.test(id))
    && [v.liturgy.kertasAcaraGid, v.liturgy.laguSionGid, v.liturgy.quarterlyScheduleGid, v.schedule.gid].every(id => typeof id === "string" && /^\d{1,12}$/.test(id)));
}
