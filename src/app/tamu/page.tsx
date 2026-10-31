import type { Metadata } from "next";
import GuestRegister from "@/components/guests/GuestRegister";
import { guestLocation } from "@/lib/guestNavigation";
import { isSaturday } from "@/lib/guestTypes";
import { isLocalDemo } from "@/lib/localDemo";
import { isAuthenticated } from "@/lib/adminAuth";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Tamu | GMAHK BSD", robots: { index: false, follow: false } };
export default async function GuestPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const { view, date } = await searchParams;
  const selected = guestLocation(view, date);
  return <GuestRegister initialLocation={selected} authenticated={await isAuthenticated()} demo={isLocalDemo()} invalidDate={Boolean(date) && !isSaturday(date!)} invalidView={Boolean(view) && view !== "usher" && view !== "mc"}/>;
}