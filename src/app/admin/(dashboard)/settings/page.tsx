import Link from "next/link";
import { redirect } from "next/navigation";
import { Typography } from "@mui/material";
import { CloudOutlined, TableChartOutlined, ArrowForward } from "@/components/ui/icons";

const sections = [
  { href: "/admin/settings/spreadsheets", title: "Sumber Spreadsheet", description: "Tautan Kertas Acara dan jadwal pelayanan.", icon: TableChartOutlined },
  { href: "/admin/settings/google", title: "Koneksi Google", description: "Status akses Drive, Sheets, dan bantuan koneksi.", icon: CloudOutlined },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const { drive } = await searchParams;
  if (drive === "error" || drive === "connected") redirect(`/admin/settings/google?drive=${drive}`);
  return <div className="settings-home">
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>Pengaturan</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Kelola sumber data dan akses Google gereja.</Typography>
    <nav className="settings-grid" aria-label="Pengaturan website">
      {sections.map(section => <Link className="settings-card" data-accent={section.icon === TableChartOutlined ? "teal" : "amber"} href={section.href} key={section.href}>
        <span className="settings-card-icon"><section.icon aria-hidden="true" /></span>
        <div className="settings-card-copy"><h2>{section.title}</h2><p>{section.description}</p></div>
        <span className="settings-card-arrow glass-thin"><ArrowForward aria-hidden="true" /></span>
      </Link>)}
    </nav>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Untuk pengelola website. Petugas dapat mengelola konten melalui Dashboard.</Typography>
  </div>;
}
