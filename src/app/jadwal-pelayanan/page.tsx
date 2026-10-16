import type { Metadata } from "next";
import QuarterlyScheduleTable from "@/components/QuarterlyScheduleTable";

export const metadata: Metadata = { title: "Jadwal Pelayanan Triwulan | GMAHK BSD", description: "Jadwal pelayanan jemaat GMAHK BSD per triwulan." };
export default function QuarterlySchedulePage() { return <QuarterlyScheduleTable />; }
