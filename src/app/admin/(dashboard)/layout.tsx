import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/adminAuth";
import { isLocalDemo, isWeeklyDemo } from "@/lib/localDemo";
import DashboardShell from "@/components/admin/DashboardShell";

export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <DashboardShell demo={isLocalDemo()} weeklyDemo={isWeeklyDemo()}>{children}</DashboardShell>;
}
