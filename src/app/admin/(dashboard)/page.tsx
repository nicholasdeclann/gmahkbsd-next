import Link from "next/link";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";

const tasks = [
  { title: "Kertas Acara", description: "Isi judul khotbah, ayat, dan lagu untuk Sabat.", href: "/admin/kertas-acara" },
  { title: "Pokok Doa", description: "Isi empat nama mingguan dan alasan doa untuk website.", href: "/admin/prayer" },
  { title: "Pengumuman", description: "Terbitkan gambar dan informasi dari seluruh departemen untuk jemaat.", href: "/admin/photos" },
];
export default function DashboardPage() {
  return <>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 750, color: "#18334d", mb: 1 }}>Selamat datang</Typography>
    <Typography color="text.secondary" sx={{ fontSize: "1.1rem", mb: 4 }}>Apa yang ingin diperbarui hari ini?</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
      {tasks.map(task => <Card key={task.href} variant="outlined" sx={{ borderRadius: 3, borderColor: "#dce4ed" }}>
        <CardActionArea component={Link} href={task.href} sx={{ height: "100%" }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{task.title} <Box component="span" aria-hidden="true" sx={{ color: "primary.main", ml: 1 }}>→</Box></Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{task.description}</Typography>
          </CardContent>
        </CardActionArea>
      </Card>)}
    </Box>
    <Typography color="text.secondary" sx={{ mt: 4 }}>Spreadsheet tetap dapat diedit seperti biasa. Unduhan dan informasi gereja akan ditambahkan pada tahap berikutnya.</Typography>
  </>;
}
