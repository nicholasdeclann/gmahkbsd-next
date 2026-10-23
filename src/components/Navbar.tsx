"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { HomeOutlined, DescriptionOutlined, CampaignOutlined, MenuOutlined, CalendarMonthOutlined, CakeOutlined, PhotoLibraryOutlined, InfoIcon, DashboardOutlined } from "./ui/icons";
import NavigationSheet from "./ui/NavigationSheet";
import { useLanguage } from "./LanguageProvider";
import DisplaySettings from "./DisplaySettings";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import { createSiteTheme } from "@/app/theme";
const headerTheme = createSiteTheme(false);
const primary = [
  { label: "Beranda", href: "/", icon: HomeOutlined },
  { label: "Acara", href: "/kertas-acara", icon: DescriptionOutlined },
  { label: "Pengumuman", href: "/pengumuman", icon: CampaignOutlined },
];
const secondary = [
  { label: "Jadwal Pelayanan", href: "/jadwal-pelayanan", icon: CalendarMonthOutlined },
  { label: "Ulang Tahun", href: "/ulang-tahun", icon: CakeOutlined },
  { label: "Kegiatan Jemaat", href: "/kegiatan", icon: PhotoLibraryOutlined },
  { label: "Tentang Gereja", href: "/#tentang", icon: InfoIcon },
  { label: "Dashboard Staf", href: "/admin", icon: DashboardOutlined },
];
export default function Navbar() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const viewport = window.visualViewport;
    function update() {
      const editing = document.activeElement?.matches("input, textarea, [contenteditable=true]");
      setKeyboard(Boolean(editing && viewport && window.innerHeight - viewport.height > 120));
    }
    viewport?.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => { viewport?.removeEventListener("resize", update); document.removeEventListener("focusin", update); document.removeEventListener("focusout", update); };
  }, []);
  if (pathname.startsWith("/admin") || pathname === "/tamu" || pathname.startsWith("/tamu/")) return null;
  const moreActive = secondary.some(item => item.href === pathname);
  return <>
    <ThemeProvider theme={headerTheme}>
      <header className="site-header glass-header"><div className="site-width navbar-inner">
        <Link href="/" className="brand" aria-label={`GMAHK BSD — ${t("Beranda")}`}>
          <Image src={imageAsset(churchConfig.assets.logo)} width={38} height={38} alt="" priority /><span>{churchConfig.shortName}</span>
        </Link>
        <nav className="desktop-nav" aria-label={t("Navigasi utama")}>
          {primary.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{t(item.label === "Acara" ? "Kertas Acara" : item.label)}</Link>)}
          <Button onClick={() => setOpen(true)} startIcon={<MenuOutlined />} aria-haspopup="dialog" aria-expanded={open}>{t("Menu")}</Button>
        </nav>
        <DisplaySettings />
      </div></header>
    </ThemeProvider>
    <nav className={`mobile-dock${keyboard ? " keyboard-open" : ""}`} aria-label={t("Navigasi utama seluler")}>
      {primary.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><item.icon aria-hidden="true" /><span>{language === "en" && item.label === "Pengumuman" ? "News" : t(item.label)}</span></Link>)}
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={moreActive ? "dock-active" : undefined}><MenuOutlined aria-hidden="true" /><span>{t("Menu")}</span></button>
    </nav>
    <NavigationSheet open={open} onClose={() => setOpen(false)} title={t("Menu")}>
      <nav className="sheet-links" aria-label={t("Halaman lainnya")}>
        {[...primary, ...secondary].map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={pathname === item.href ? "page" : undefined}><item.icon aria-hidden="true" /><span>{t(item.label === "Acara" ? "Kertas Acara" : item.label)}</span></Link>)}
      </nav>
    </NavigationSheet>
  </>;
}
