"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  DescriptionOutlined,
  CampaignOutlined,
  MenuOutlined,
  CalendarMonthOutlined,
  CakeOutlined,
  PhotoLibraryOutlined,
  InfoIcon,
  DashboardOutlined,
  FavoriteBorder,
} from "./ui/icons";
import NavigationSheet from "./ui/NavigationSheet";
import { useLanguage } from "./LanguageProvider";
import DisplaySettings from "./DisplaySettings";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

const desktopLinks = [
  { label: "Beranda", href: "/" },
  { label: "Kertas Acara", href: "/kertas-acara" },
  { label: "Pengumuman", href: "/pengumuman" },
  { label: "Kegiatan", href: "/kegiatan" },
  { label: "Persembahan", href: "/#persembahan" },
];

const desktopIconButtons = [
  { label: "Jadwal Pelayanan", href: "/jadwal-pelayanan", icon: CalendarMonthOutlined },
  { label: "Ulang Tahun", href: "/ulang-tahun", icon: CakeOutlined },
];

const dockPrimary = [
  { label: "Beranda", href: "/", icon: HomeOutlined },
  { label: "Acara", href: "/kertas-acara", icon: DescriptionOutlined },
  { label: "Pengumuman", href: "/pengumuman", icon: CampaignOutlined },
];

const menuGroups = [
  {
    title: "Ibadah",
    items: [
      { label: "Beranda", href: "/", icon: HomeOutlined },
      { label: "Kertas Acara", href: "/kertas-acara", icon: DescriptionOutlined },
      { label: "Jadwal Pelayanan", href: "/jadwal-pelayanan", icon: CalendarMonthOutlined },
    ],
  },
  {
    title: "Kabar & Jemaat",
    items: [
      { label: "Pengumuman", href: "/pengumuman", icon: CampaignOutlined },
      { label: "Kegiatan Jemaat", href: "/kegiatan", icon: PhotoLibraryOutlined },
      { label: "Ulang Tahun", href: "/ulang-tahun", icon: CakeOutlined },
    ],
  },
  {
    title: "Gereja & Staf",
    items: [
      { label: "Persembahan & Perpuluhan", href: "/#persembahan", icon: FavoriteBorder },
      { label: "Tentang Gereja", href: "/#tentang", icon: InfoIcon },
      { label: "Dashboard Staf", href: "/admin", icon: DashboardOutlined },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function check() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setAdmin(data?.authenticated === true);
      } catch {
        if (!controller.signal.aborted) setAdmin(false);
      }
    }
    void check();
    window.addEventListener("focus", check);
    return () => {
      controller.abort();
      window.removeEventListener("focus", check);
    };
  }, [pathname]);

  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const viewport = window.visualViewport;
    function update() {
      const editing = document.activeElement?.matches("input, textarea, [contenteditable=true]");
      setKeyboard(Boolean(editing && viewport && window.innerHeight - viewport.height > 120));
    }
    viewport?.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  if (pathname.startsWith("/admin") || pathname === "/tamu" || pathname.startsWith("/tamu/")) return null;

  const moreActive = ["/jadwal-pelayanan", "/ulang-tahun", "/kegiatan"].includes(pathname);

  return (
    <>
      <header className="site-header glass-header">
        <div className="site-width navbar-inner">
          <Link href="/" className="brand" aria-label={`GMAHK BSD — ${t("Beranda")}`}>
            <Image src={imageAsset(churchConfig.assets.logo)} width={36} height={36} alt="" priority />
            <span>{churchConfig.shortName}</span>
          </Link>
          <nav className="desktop-nav" aria-label={t("Navigasi utama")}>
            {desktopLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
          <div className="header-icon-actions">
            {desktopIconButtons.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header-icon-btn desktop-only-icon"
                aria-label={t(item.label)}
                title={t(item.label)}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon aria-hidden="true" />
              </Link>
            ))}
            {admin && (
              <Link
                href="/admin"
                className="header-icon-btn header-icon-btn--accent"
                aria-label={t("Dashboard Staf")}
                title={t("Dashboard Staf")}
              >
                <DashboardOutlined aria-hidden="true" />
              </Link>
            )}
            <DisplaySettings />
          </div>
        </div>
      </header>
      <nav className={`mobile-dock${keyboard ? " keyboard-open" : ""}`} aria-label={t("Navigasi utama seluler")}>
        {dockPrimary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <item.icon aria-hidden="true" />
            <span>{language === "en" && item.label === "Pengumuman" ? "News" : t(item.label)}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={moreActive ? "dock-active" : undefined}
        >
          <MenuOutlined aria-hidden="true" />
          <span>{t("Menu")}</span>
        </button>
      </nav>
      <NavigationSheet open={open} onClose={() => setOpen(false)} title={t("Menu")}>
        <div className="sheet-sections">
          {menuGroups.map((group) => (
            <section className="sheet-group" key={group.title} aria-label={t(group.title)}>
              <h3 className="sheet-group-title">{t(group.title)}</h3>
              <nav className="sheet-links" aria-label={t(group.title)}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{t(item.label)}</span>
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>
      </NavigationSheet>
    </>
  );
}
