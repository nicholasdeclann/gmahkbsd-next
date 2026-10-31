"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import StaffHeader from "../admin/StaffHeader";
import DisplaySettings from "../DisplaySettings";
import NavigationSheet from "../ui/NavigationSheet";
import { GlassButton } from "../ui/glass/GlassControls";
import { ArrowBack, MenuOutlined, OpenInNew } from "../ui/icons";
import { useLanguage } from "../LanguageProvider";
import type { GuestView } from "@/lib/guestNavigation";

export default function GuestShell({ children, view, demo, authenticated, onNavigate }: { children: ReactNode; view: GuestView; demo: boolean; authenticated: boolean; onNavigate: (href: string) => void }) {
  const { t } = useLanguage();
  const [menu, setMenu] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".guest-shell .admin-header"); if (!header) return;
    const measure = () => setHeaderHeight(header.getBoundingClientRect().height);
    const observer = new ResizeObserver(measure); observer.observe(header); measure(); return () => observer.disconnect();
  }, []);
  const parent = authenticated ? "/admin" : "/admin/login";
  const parentLabel = authenticated ? "Dashboard" : "Masuk Admin";
  const links = [{href:parent,label:parentLabel},{href:"/admin/kertas-acara",label:"Kertas Acara"},{href:"/admin/prayer",label:"Pokok Doa"},{href:"/admin/photos",label:"Pengumuman"},{href:"/admin/events",label:"Kegiatan Jemaat"},{href:"/admin/settings",label:"Pengaturan"}];
  return <Box className="guest-shell" style={{ "--guest-header-height": `${headerHeight}px` } as CSSProperties} sx={{ minHeight: "100dvh", bgcolor: "var(--site-bg)" }} onClickCapture={event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || anchor.target === "_blank" || anchor.origin !== location.origin || anchor.hash === "#main-content") return;
    event.preventDefault(); setMenu(false); onNavigate(anchor.pathname + anchor.search + anchor.hash);
  }}>
    <a className="skip-link" href="#main-content">{t("Langsung ke daftar tamu")}</a>
    <StaffHeader href={parent} subtitle={t("Daftar Tamu")} navigation={<nav className="admin-desktop-nav" aria-label={t("Navigasi staf")}>{links.map(link=><Link key={link.href} href={link.href}>{t(link.label)}</Link>)}</nav>}>
      <Link href="/" className="header-icon-btn" aria-label={t("Lihat Website")}><OpenInNew aria-hidden="true"/></Link>
      <DisplaySettings/>
      <button type="button" className="header-icon-btn guest-menu-trigger" aria-haspopup="dialog" aria-expanded={menu} aria-label={t("Menu Staf")} onClick={()=>setMenu(true)}><MenuOutlined aria-hidden="true"/></button>
    </StaffHeader>
    <NavigationSheet open={menu} onClose={()=>setMenu(false)} title="Menu Staf"><nav className="sheet-links" aria-label={t("Navigasi staf")}>{links.map(link=><Link key={link.href} href={link.href}>{t(link.label)}</Link>)}</nav></NavigationSheet>
    <Container component="main" className="guest-content guest-main" id="main-content" tabIndex={-1} maxWidth="lg">
      <div className="admin-breadcrumb-row"><GlassButton component={Link} href={parent} startIcon={<ArrowBack/>}>{t(parentLabel)}</GlassButton><nav aria-label={t("Breadcrumb")} className="admin-breadcrumbs"><ol><li><Link href={parent}>{t(parentLabel)}</Link></li><li>{t("Daftar Tamu")}</li><li><span aria-current="page">{t(view === "mc" ? "MC" : "Penerima Tamu")}</span></li></ol></nav></div>
      {demo && <Typography role="status" className="admin-demo-note">{t("Mode latihan lokal · catatan tidak dikirim ke Google Drive gereja.")}</Typography>}
      {children}
    </Container>
  </Box>;
}
