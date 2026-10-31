"use client";
import { T } from "@/components/LanguageProvider";
import { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSiteTheme } from "@/app/theme";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import Navbar from "./Navbar";
import { ColorModeContext } from "./ColorModeContext";
import GlassRuntime from "./ui/glass/GlassRuntime";
import NotificationProvider from "./ui/notifications/NotificationProvider";

export default function SiteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const staff = pathname === "/tamu" || pathname.startsWith("/tamu/");
  const [preference, setPreference] = useState(false);
  useEffect(() => {
    try {
      setPreference(localStorage.getItem("gmahkbsd-color-mode") === "dark");
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);
  const dark = preference;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const theme = useMemo(() => createSiteTheme(dark), [dark]);
  function toggle() {
    const next = !preference;
    setPreference(next);
    try {
      localStorage.setItem("gmahkbsd-color-mode", next ? "dark" : "light");
    } catch {
      /* The toggle still works for this visit. */
    }
  }
  return (
    <ColorModeContext.Provider value={{ dark, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlassRuntime />
        <NotificationProvider>
        <div
          className={`site-frame${!admin && !staff ? " public-frame" : ""}`}
          data-theme={dark ? "dark" : "light"}
        >
          {!admin && !staff && (
            <a className="skip-link" href="#main-content">
              <T text="Langsung ke isi halaman" />
            </a>
          )}
          <Navbar />
          {admin || staff ? (
            children
          ) : (
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          )}
          {!admin && !staff && (
            <footer className="site-footer">
              <div className="site-width footer-inner">
                <div className="footer-brand">
                  <span className="footer-logo-mark">
                    <Image
                      src={imageAsset(churchConfig.assets.logo)}
                      width={26}
                      height={26}
                      alt=""
                    />
                  </span>
                  <small>© {new Date().getFullYear()} {churchConfig.shortName}</small>
                </div>
                <div className="footer-links">
                  <Link href="/#kunjungi">
                    <T text="Kunjungi Kami" />
                  </Link>
                  <Link href="/admin">
                    <T text="Dashboard Staf" />
                  </Link>
                  <Link href="/#persembahan">
                    <T text="Persembahan & Perpuluhan" />
                  </Link>
                  <Link href="/privacy-policy">Kebijakan Privasi</Link>
                </div>
              </div>
            </footer>
          )}
        </div>
        </NotificationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
