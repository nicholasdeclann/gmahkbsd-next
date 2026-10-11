"use client";

import { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createSiteTheme } from "@/app/theme";
import { churchConfig } from "@/config/church";
import Navbar from "./Navbar";
import { ColorModeContext } from "./ColorModeContext";

export default function SiteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const [preference, setPreference] = useState(false);
  useEffect(() => {
    try { setPreference(localStorage.getItem("gmahkbsd-color-mode") === "dark"); } catch { /* Storage may be unavailable. */ }
  }, []);
  const dark = preference;
  const theme = useMemo(() => createSiteTheme(dark), [dark]);
  function toggle() {
    const next = !preference;
    setPreference(next);
    try { localStorage.setItem("gmahkbsd-color-mode", next ? "dark" : "light"); } catch { /* The toggle still works for this visit. */ }
  }
  return <ColorModeContext.Provider value={{ dark, toggle }}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="site-frame" data-theme={dark ? "dark" : "light"}>
        {!admin && <a className="skip-link" href="#main-content">Langsung ke isi halaman</a>}
        <Navbar />
        {admin ? children : <main id="main-content" tabIndex={-1}>{children}</main>}
        {!admin && <footer className="site-footer">
          <div className="site-width footer-inner">
            <div><strong>{churchConfig.name}</strong><p>Beribadah, bertumbuh, dan melayani bersama.</p></div>
            <div className="footer-links"><Link href="/">Beranda</Link><Link href="/#tentang">Tentang Gereja</Link><Link href="/pengumuman">Pengumuman</Link><Link href="/admin">Dashboard Staf</Link></div>
            <small>© {new Date().getFullYear()} {churchConfig.name}</small>
          </div>
        </footer>}
      </div>
    </ThemeProvider>
  </ColorModeContext.Provider>;
}
