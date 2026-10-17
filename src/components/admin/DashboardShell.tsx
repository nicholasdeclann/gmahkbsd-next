"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Typography, Menu, MenuItem, ListItemIcon, Divider } from "@mui/material";
import DisplaySettings from "../DisplaySettings";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import OpenInNew from "@mui/icons-material/OpenInNew";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import { ThemeProvider } from "@mui/material/styles";
import { createSiteTheme } from "@/app/theme";
const headerTheme = createSiteTheme(false);
const destinations=[{title:"Dashboard",href:"/admin",icon:DashboardOutlined},{title:"Kertas Acara",href:"/admin/kertas-acara",icon:DescriptionOutlined},{title:"Pokok Doa",href:"/admin/prayer",icon:FavoriteBorder},{title:"Pengumuman",href:"/admin/photos",icon:CampaignOutlined},{title:"Kegiatan Jemaat",href:"/admin/events",icon:PhotoLibraryOutlined},{title:"Daftar Tamu",href:"/tamu",icon:PeopleOutline},{title:"Pengaturan Website",href:"/admin/settings",icon:SettingsOutlined}];

export default function DashboardShell({ children, demo, weeklyDemo }: { children: React.ReactNode; demo: boolean; weeklyDemo: boolean }) {
  const pathname = usePathname();
  const [anchor,setAnchor]=useState<HTMLElement|null>(null);
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
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--site-bg)" }}>
      <ThemeProvider theme={headerTheme}><Box component="header" className="admin-header" sx={{ bgcolor: "white", borderBottom: "1px solid #dfe5ed" }}>
        <Container maxWidth="md" sx={{ py: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ flex: 1 }}>
            <Typography component={Link} href="/admin" sx={{ color: "var(--site-text)", textDecoration: "none", fontWeight: 550, fontSize: "1.25rem" }}>GMAHK BSD</Typography>
            <Typography color="text.secondary" variant="body2">Dashboard Staf</Typography>
          </Box>
          <Button component={Link} href="/" className="admin-website-link" startIcon={<OpenInNew/>}>Lihat Website</Button>
          <Button startIcon={<MenuOutlined/>} onClick={event=>setAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(anchor)} aria-controls={anchor?"staff-navigation":undefined}>Menu</Button>
          <DisplaySettings/>
          <Menu id="staff-navigation" anchorEl={anchor} open={Boolean(anchor)} onClose={()=>setAnchor(null)} slotProps={{list:{"aria-label":"Navigasi staf"},paper:{sx:{minWidth:260}}}}>
            {destinations.map(item=><MenuItem key={item.href} component={Link} href={item.href} selected={pathname===item.href} onClick={()=>setAnchor(null)}><ListItemIcon><item.icon fontSize="small"/></ListItemIcon>{item.title}</MenuItem>)}
            <Divider/>
            <MenuItem component={Link} href="/"><ListItemIcon><OpenInNew fontSize="small"/></ListItemIcon>Lihat Website</MenuItem>
            <MenuItem disabled={leaving} onClick={()=>{setAnchor(null);void logout();}}><ListItemIcon><LogoutOutlined fontSize="small"/></ListItemIcon>{leaving?"Keluar…":"Keluar"}</MenuItem>
          </Menu>
        </Container>
      </Box></ThemeProvider>
      <Container component="main" className="admin-content" id="main-content" maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, "& .MuiButton-root": { minHeight: 46, textTransform: "none", fontSize: "1rem" }, "& .MuiInputBase-root": { bgcolor: "var(--site-surface)" } }}>
        <AdminBreadcrumbs/>
        {demo && <p className="admin-demo-note" role="status">{weeklyDemo?"Mode latihan lokal · perubahan tidak memengaruhi website gereja.":"Mode lokal · Kertas Acara dan Pokok Doa memakai spreadsheet gereja."}</p>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {children}
      </Container>
    </Box>
  );
}
