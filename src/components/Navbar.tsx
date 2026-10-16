"use client";
import { T, LanguageSwitch, useLanguage } from "@/components/LanguageProvider";


import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import WhatsApp from "@mui/icons-material/WhatsApp";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import { useColorMode } from "./ColorModeContext";
import { ThemeProvider } from "@mui/material/styles";
import { createSiteTheme } from "@/app/theme";
const headerTheme = createSiteTheme(false);

const links = [{ label: "Beranda", href: "/" }, { label: "Tentang", href: "/#tentang" }, { label: "Kertas Acara", href: "/kertas-acara" }, { label: "Jadwal Pelayanan", href: "/jadwal-pelayanan" }, { label: "Pengumuman", href: "/pengumuman" }, { label: "Ulang Tahun", href: "/ulang-tahun" }];
export const PASTOR_URL = "https://wa.me/+62895337627700";

export default function Navbar() {
  const pathname = usePathname();
  const {t} = useLanguage();
  const { dark, toggle } = useColorMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (pathname.startsWith("/admin") || pathname === "/tamu" || pathname.startsWith("/tamu/")) return null;
  return <ThemeProvider theme={headerTheme}><header className="site-header">
    <div className="site-width navbar-inner">
      <Link href="/" className="brand" aria-label="GMAHK BSD — Beranda">
        <span className="brand-logo"><Image src={imageAsset(churchConfig.assets.logo)} width={46} height={46} alt="" priority /></span>
        <span>{churchConfig.shortName}<small>Bumi Serpong Damai</small></span>
      </Link>
      <nav className="desktop-nav" aria-label={t("Navigasi utama")}>
        {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{t(link.label)}</Link>)}
      </nav>
      <div className="nav-actions">
        <Button className="theme-button" onClick={toggle} aria-label={t(dark ? "Gunakan tampilan terang" : "Gunakan tampilan gelap")} startIcon={dark ? <LightModeOutlined /> : <DarkModeOutlined />}>
          {t(dark ? "Terang" : "Gelap")}
        </Button>
        <Button className="pastor-nav" href={PASTOR_URL} target="_blank" rel="noopener noreferrer" variant="outlined" startIcon={<WhatsApp />}><T text="Pendeta" /></Button>
        <Button className="mobile-menu-button" startIcon={<MenuIcon />} onClick={event => setAnchor(event.currentTarget)} aria-expanded={Boolean(anchor)} aria-controls={anchor ? "mobile-navigation" : undefined} aria-haspopup="true">Menu</Button>
        <LanguageSwitch />
      </div>
      <Menu id="mobile-navigation" anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ list: { "aria-label": "Navigasi utama" }, paper: { sx: { minWidth: 240 } } }}>
        {links.map(link => <MenuItem key={link.href} component={Link} href={link.href} selected={pathname === link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setAnchor(null)}>{t(link.label)}</MenuItem>)}
        <MenuItem component="a" href={PASTOR_URL} target="_blank" rel="noopener noreferrer" onClick={() => setAnchor(null)}><T text="Hubungi Pendeta ↗" /></MenuItem>
      </Menu>
    </div>
  </header></ThemeProvider>;
}
