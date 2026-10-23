"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Box, Button, Container } from "@mui/material";
import DisplaySettings from "../DisplaySettings";
import NavigationSheet from "../ui/NavigationSheet";
import { MenuOutlined, DashboardOutlined, DescriptionOutlined, FavoriteBorder, CampaignOutlined, PhotoLibraryOutlined, PeopleOutline, SettingsOutlined, OpenInNew, LogoutOutlined, ArrowBack, RecordVoiceOverOutlined } from "../ui/icons";
import { ThemeProvider } from "@mui/material/styles";
import { createSiteTheme } from "@/app/theme";
const headerTheme = createSiteTheme(false);
const destinations = [
  {title:"Dashboard",href:"/admin",icon:DashboardOutlined},
  {title:"Kertas Acara",href:"/admin/kertas-acara",icon:DescriptionOutlined},
  {title:"Pokok Doa",href:"/admin/prayer",icon:FavoriteBorder},
  {title:"Pengumuman",href:"/admin/photos",icon:CampaignOutlined},
  {title:"Kegiatan Jemaat",href:"/admin/events",icon:PhotoLibraryOutlined},
  {title:"Penerima Tamu",href:"/tamu",icon:PeopleOutline},
  {title:"Tampilan MC",href:"/tamu/mc",icon:RecordVoiceOverOutlined},
  {title:"Pengaturan Website",href:"/admin/settings",icon:SettingsOutlined},
];
export default function DashboardShell({ children, demo, weeklyDemo }: { children: React.ReactNode; demo: boolean; weeklyDemo: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/admin/login");
      router.refresh();
    } catch { setError("Belum berhasil keluar. Silakan coba lagi."); setLeaving(false); }
  }
  return <Box sx={{ minHeight: "100dvh", bgcolor: "var(--site-bg)" }}>
    <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>
    <ThemeProvider theme={headerTheme}><Box component="header" className="admin-header glass-header">
      <Container maxWidth="md" sx={{ display:"flex",alignItems:"center" }}>
        {pathname !== "/admin" && <Button component={Link} href="/admin" aria-label="Kembali ke Dashboard" sx={{minWidth:44,width:44,p:1}}><ArrowBack /></Button>}
        <div className="staff-brand"><Link href="/admin">GMAHK BSD<small>Dashboard Staf</small></Link></div>
        <Button startIcon={<MenuOutlined />} onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>Menu</Button>
        <DisplaySettings />
      </Container>
    </Box></ThemeProvider>
    <NavigationSheet open={open} onClose={()=>setOpen(false)} title="Menu Staf">
      <nav className="sheet-links" aria-label="Navigasi staf">
        {destinations.map(item=><Link key={item.href} href={item.href} aria-current={pathname===item.href?"page":undefined} onClick={()=>setOpen(false)}><item.icon aria-hidden="true" /><span>{item.title}</span></Link>)}
        <Link href="/" onClick={()=>setOpen(false)}><OpenInNew aria-hidden="true" />Lihat Website</Link>
        <button type="button" disabled={leaving} onClick={()=>{setOpen(false);void logout();}} className="danger-action"><LogoutOutlined aria-hidden="true" />{leaving?"Keluar…":"Keluar"}</button>
      </nav>
    </NavigationSheet>
    <Container component="main" className="admin-content" id="main-content" tabIndex={-1} maxWidth="md">
      {demo && <p className="admin-demo-note" role="status">{weeklyDemo?"Mode latihan lokal · perubahan tidak memengaruhi website gereja.":"Mode lokal · Kertas Acara dan Pokok Doa memakai spreadsheet gereja."}</p>}
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      {children}
    </Container>
  </Box>;
}