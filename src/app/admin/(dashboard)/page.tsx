import Link from "next/link";
import { Typography } from "@mui/material";
import {
  DescriptionOutlined,
  FavoriteBorder,
  CampaignOutlined,
  PhotoLibraryOutlined,
  PeopleOutline,
  RecordVoiceOverOutlined,
  SettingsOutlined,
  ArrowForward,
} from "@/components/ui/icons";

const weekly = [
  {
    title: "Kertas Acara",
    badge: "Sabat Ini",
    description: "Perbarui judul khotbah, pembicara, ayat inti, dan lagu ibadah Sabat.",
    href: "/admin/kertas-acara",
    icon: DescriptionOutlined,
    accent: "blue",
  },
  {
    title: "Pokok Doa",
    badge: "4 Slot Mingguan",
    description: "Kelola daftar nama dan pokok doa jemaat yang ditampilkan pekan ini.",
    href: "/admin/prayer",
    icon: FavoriteBorder,
    accent: "rose",
  },
  {
    title: "Pengumuman",
    badge: "Warta Jemaat",
    description: "Unggah dan atur poster pengumuman mingguan untuk jemaat.",
    href: "/admin/photos",
    icon: CampaignOutlined,
    accent: "amber",
  },
  {
    title: "Kegiatan Jemaat",
    badge: "Galeri Bulanan",
    description: "Kelola dokumentasi foto pelayanan dan arsip kegiatan bulanan.",
    href: "/admin/events",
    icon: PhotoLibraryOutlined,
    accent: "violet",
  },
];

const tools = [
  {
    title: "Penerima Tamu",
    badge: "Meja Sambutan",
    description: "Formulir buku tamu Sabat yang cepat diakses oleh tim penerima tamu.",
    href: "/tamu",
    icon: PeopleOutline,
    accent: "teal",
  },
  {
    title: "Tampilan MC",
    badge: "Mimbar & Sambutan",
    description: "Daftar tamu terkini yang mudah dibaca untuk sesi penyambutan.",
    href: "/tamu/mc",
    icon: RecordVoiceOverOutlined,
    accent: "violet",
  },
  {
    title: "Pengaturan Website",
    badge: "Integrasi & Akun",
    description: "Kelola koneksi Google Drive, spreadsheet, dan pengaturan staf.",
    href: "/admin/settings",
    icon: SettingsOutlined,
    accent: "slate",
  },
];

export default function DashboardPage() {
  return (
    <>
      <div className="dashboard-hero-head">
        <div>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 500, mb: 0.75 }}>
            Dashboard Staf
          </Typography>
          <Typography color="text.secondary">
            Pilih kartu di bawah untuk mengelola konten ibadah Sabat, warta jemaat, dan alat pelayanan.
          </Typography>
        </div>
      </div>

      {[
        { title: "Kelola Konten Sabat", items: weekly },
        { title: "Alat Pelayanan & Pengaturan", items: tools },
      ].map((group) => (
        <section className="dashboard-group" key={group.title}>
          <h2 className="dashboard-group-title">{group.title}</h2>
          <nav className="dashboard-card-grid" aria-label={group.title}>
            {group.items.map((task) => (
              <Link
                key={task.href}
                href={task.href}
                className="dashboard-card"
                data-accent={task.accent}
              >
                <div className="dashboard-card-top">
                  <span className="dashboard-card-icon">
                    <task.icon aria-hidden="true" />
                  </span>
                  <span className="dashboard-card-badge">{task.badge}</span>
                </div>
                <div className="dashboard-card-body">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </div>
                <div className="dashboard-card-footer">
                  <span>Buka halaman</span>
                  <ArrowForward className="task-arrow" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </nav>
        </section>
      ))}
    </>
  );
}
