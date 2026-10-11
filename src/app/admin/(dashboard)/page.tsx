import Link from "next/link";
import { Typography } from "@mui/material";

const tasks = [
  { title: "Kertas Acara", description: "Isi judul khotbah, ayat, dan lagu untuk Sabat.", href: "/admin/kertas-acara" },
  { title: "Pokok Doa", description: "Isi empat nama mingguan dan alasan doa untuk website.", href: "/admin/prayer" },
  { title: "Pengumuman", description: "Terbitkan gambar dan informasi dari seluruh departemen untuk jemaat.", href: "/admin/photos" },
];
export default function DashboardPage() {
  return <>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, color: "var(--site-text)", mb: 1 }}>Selamat datang</Typography>
    <Typography color="text.secondary" sx={{ fontSize: "1.1rem", mb: 4 }}>Apa yang ingin diperbarui hari ini?</Typography>
    <nav className="dashboard-task-list" aria-label="Kelola website">
      {tasks.map(task => <Link key={task.href} href={task.href}>
        <div><h2>{task.title}</h2><p>{task.description}</p></div>
        <span aria-hidden="true">→</span>
      </Link>)}
    </nav>
    <Typography color="text.secondary" sx={{ mt: 4 }}>Spreadsheet tetap dapat diedit seperti biasa. Unduhan dan informasi gereja akan ditambahkan pada tahap berikutnya.</Typography>
  </>;
}
