import { addDays, nextSabbath } from "@/lib/announcementTypes";
import { churchConfig } from "@/config/church";

// Resolve both poster and spreadsheet views against the same Jakarta Sabbath.
export const getThisWeeksSaturday = (columnOffset: number) => new Date(addDays(nextSabbath(), columnOffset * 7) + "T12:00:00Z");
export const formatDate = (date: Date) => String(date.getUTCDate()).padStart(2, "0") + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][date.getUTCMonth()];
export const getSaturdayOfMonth = (date: Date) => Math.floor((date.getUTCDate() - 1) / 7) + 1;

export const formatLaguSion = (
  laguNum: string | number,
  laguSionMap: Record<string, string>,
) => {
  if (laguNum === undefined || laguNum === null || laguNum === "") return "";
  const raw = String(laguNum).trim();
  const match = /^(\d+)(?:\s+(.+))?$/.exec(raw);
  const numKey = match ? match[1] : raw;
  const suffix = match?.[2] ? ` ${match[2]}` : "";
  const title = laguSionMap[numKey];
  if (!title) return "";
  return `${churchConfig.kertasAcara.hymnalPrefix} ${numKey} | ${title}${suffix}`;
};
