import { currentSaturday, isSaturday } from "./guestTypes";
export type GuestView = "usher" | "mc";
export interface GuestLocation { view: GuestView; date: string }
export function guestLocation(view?: string | null, date?: string | null): GuestLocation {
  return { view: view === "mc" ? "mc" : "usher", date: date && isSaturday(date) ? date : currentSaturday() };
}
export function guestHref(location: GuestLocation): string {
  return `/tamu?view=${location.view}&date=${location.date}`;
}
