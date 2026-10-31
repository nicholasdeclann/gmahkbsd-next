import { redirect } from "next/navigation";
import { guestHref, guestLocation } from "@/lib/guestNavigation";
export default async function LegacyMcPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  redirect(guestHref(guestLocation("mc", date)));
}