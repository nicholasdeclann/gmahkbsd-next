"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Box, Button, Container } from "@mui/material";
import DisplaySettings from "../DisplaySettings";
import AdminBreadcrumbs from "./AdminBreadcrumbs";
import NavigationSheet from "../ui/NavigationSheet";
import {
  MenuOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  FavoriteBorder,
  CampaignOutlined,
  PhotoLibraryOutlined,
  PeopleOutline,
  SettingsOutlined,
  OpenInNew,
  LogoutOutlined,
  ArrowBack,
  RecordVoiceOverOutlined,
} from "../ui/icons";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

const desktopNavLinks = [
  { title: "Dashboard", href: "/admin" },
  { title: "Kertas Acara", href: "/admin/kertas-acara" },
  { title: "Pokok Doa", href: "/admin/prayer" },
  { title: "Pengumuman", href: "/admin/photos" },
  { title: "Kegiatan", href: "/admin/events" },
  { title: "Tamu", href: "/tamu" },
  { title: "Pengaturan", href: "/admin/settings" },
];

const drawerGroups = [
  {
    title: "Kelola Konten Sabat",
    items: [
      { title: "Dashboard", href: "/admin", icon: DashboardOutlined },
      { title: "Kertas Acara", href: "/admin/kertas-acara", icon: DescriptionOutlined },
      { title: "Pokok Doa", href: "/admin/prayer", icon: FavoriteBorder },
      { title: "Pengumuman", href: "/admin/photos", icon: CampaignOutlined },
      { title: "Kegiatan Jemaat", href: "/admin/events", icon: PhotoLibraryOutlined },
    ],
  },
  {
    title: "Alat Pelayanan & Pengaturan",
    items: [
      { title: "Penerima Tamu", href: "/tamu", icon: PeopleOutline },
      { title: "Tampilan MC", href: "/tamu/mc", icon: RecordVoiceOverOutlined },
      { title: "Pengaturan Website", href: "/admin/settings", icon: SettingsOutlined },
    ],
  },
];

export default function DashboardShell({
  children,
  demo,
  weeklyDemo,
}: {
  children: React.ReactNode;
  demo: boolean;
  weeklyDemo: boolean;
}) {
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
    } catch {
      setError("Belum berhasil keluar. Silakan coba lagi.");
      setLeaving(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "var(--site-bg)" }}>
      <a className="skip-link" href="#main-content">
        Langsung ke isi halaman
      </a>
      <Box component="header" className="admin-header glass-header">
        <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {pathname !== "/admin" && (
            <Button
              component={Link}
              href="/admin"
              aria-label="Kembali ke Dashboard"
              sx={{ minWidth: 44, width: 44, p: 1 }}
            >
              <ArrowBack />
            </Button>
          )}
          <div className="staff-brand">
            <Link href="/admin" className="staff-brand-link">
              <Image src={imageAsset(churchConfig.assets.logo)} width={34} height={34} alt="" />
              <span>
                GMAHK BSD<small>Dashboard Staf</small>
              </span>
            </Link>
          </div>
          <nav className="admin-desktop-nav" aria-label="Navigasi staf">
            {desktopNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="header-icon-actions">
            <Link
              href="/"
              className="header-icon-btn"
              aria-label="Lihat Website"
              title="Lihat Website"
            >
              <OpenInNew aria-hidden="true" />
            </Link>
            <DisplaySettings />
            <button
              type="button"
              disabled={leaving}
              onClick={() => void logout()}
              className="header-icon-btn header-icon-btn--danger desktop-only-icon"
              aria-label={leaving ? "Keluar…" : "Keluar"}
              title={leaving ? "Keluar…" : "Keluar"}
            >
              <LogoutOutlined aria-hidden="true" />
            </button>
            <button
              type="button"
              className="header-icon-btn admin-menu-icon-trigger"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label="Menu Staf"
              title="Menu Staf"
            >
              <MenuOutlined aria-hidden="true" />
            </button>
          </div>
        </Container>
      </Box>
      <NavigationSheet open={open} onClose={() => setOpen(false)} title="Menu Staf">
        <div className="sheet-sections">
          {drawerGroups.map((group) => (
            <section className="sheet-group" key={group.title} aria-label={group.title}>
              <h3 className="sheet-group-title">{group.title}</h3>
              <nav className="sheet-links" aria-label={group.title}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>
            </section>
          ))}
          <section className="sheet-group" aria-label="Aksi Akun">
            <nav className="sheet-links" aria-label="Aksi Akun">
              <Link href="/" onClick={() => setOpen(false)}>
                <OpenInNew aria-hidden="true" />
                <span>Lihat Website</span>
              </Link>
              <button
                type="button"
                disabled={leaving}
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
                className="danger-action"
              >
                <LogoutOutlined aria-hidden="true" />
                <span>{leaving ? "Keluar…" : "Keluar"}</span>
              </button>
            </nav>
          </section>
        </div>
      </NavigationSheet>
      <Container
        component="main"
        className="admin-content"
        id="main-content"
        tabIndex={-1}
        maxWidth="lg"
      >
        <AdminBreadcrumbs />
        {demo && (
          <p className="admin-demo-note" role="status">
            {weeklyDemo
              ? "Mode latihan lokal · perubahan tidak memengaruhi website gereja."
              : "Mode lokal · Kertas Acara dan Pokok Doa memakai spreadsheet gereja."}
          </p>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {children}
      </Container>
    </Box>
  );
}
