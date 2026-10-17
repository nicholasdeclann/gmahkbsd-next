import Link from "next/link";
import { Typography, Alert } from "@mui/material";
export default function CanvaSetup() {
  return <>
    <Typography component="h1" variant="h4" sx={{ mb: 2 }}>Pengaturan Presentasi Canva</Typography>
    <Alert severity="info" sx={{ mb: 3 }}>Pengaturan sekali oleh pengelola website dan pemilik desain. Setelah siap, staf memakai Pratinjau dan Sync to Canva.</Alert>
    <Typography component="h2" variant="h5">1. Hubungkan Canva</Typography>
    <p>Buat integrasi di <a href="https://www.canva.com/developers/apps" target="_blank" rel="noopener noreferrer">Canva Developer Portal</a> dengan izin design:content:read dan design:content:write. Gunakan akun dengan akses edit ke desain Pengumuman dan paket Canva yang mendukung Autofill.</p>
    <p>Atur URL callback berikut pada integrasi dan konfigurasi server. Untuk production, ganti localhost dengan domain website.</p>
    <pre style={{ overflowX: "auto" }}>{`CANVA_CLIENT_ID=...\nCANVA_CLIENT_SECRET=...\nCANVA_REDIRECT_URI=http://localhost:3000/api/admin/canva/callback`}</pre>
    <p>Simpan konfigurasi lokal di .env.development.local, restart server, lalu klik Hubungkan Canva. Koneksi berlaku pada browser staf tersebut; kredensial disimpan terenkripsi dalam cookie selama tujuh hari. Hubungkan ulang jika sesi berakhir.</p>
    <Typography component="h2" variant="h5">2. Siapkan field desain</Typography>
    <p>Buka desain Pengumuman DAG-9nAgcSE di Canva, kemudian gunakan Data Autofill untuk menandai kotak teks sesuai nama field pada pratinjau. Pertahankan semua halaman dan tata letak lainnya.</p>
    <p>Field tanggal: current_sabbath dan next_sabbath. Field doa: prayer_name_1 sampai prayer_name_4 dan prayer_note_1 sampai prayer_note_4. Field announcements berisi gabungan keterangan pengumuman yang dipilih.</p>
    <p>Spreadsheet yang terhubung hanya memuat pelayanan Sabat. Nama dan tanggal Rabu Malam serta Vesper tetap diperbarui langsung di Canva sampai tersedia sumber data terstruktur.</p>
    <p>Nama field petugas ditampilkan di bawah setiap peran pada pratinjau. Cocokkan satu field dengan satu kotak nama petugas. Kotak teks kosong juga perlu ditandai agar isian minggu lalu dapat dibersihkan.</p>
    <Typography component="h2" variant="h5">3. Periksa sebelum sinkronisasi</Typography>
    <p>Simpan Pokok Doa untuk Sabat minggu ini melalui admin. Hanya alasan yang ditandai publik akan disertakan. Jadwal pelayanan menggunakan Sabat berikutnya. Sumber jadwal yang tidak tersedia menghentikan sinkronisasi. Peran yang kosong ditampilkan sebagai peringatan dan akan mengosongkan field terkait di Canva.</p>
    <p>Pilih pengumuman yang relevan secara manual. Sinkronisasi tahap ini mengisi teks; poster dan gambar tetap dikelola langsung di Canva. Periksa panjang teks dan tata letak presentasi setelah sinkronisasi.</p>
    <p>Mode latihan tidak dapat mengubah desain Canva. Sinkronisasi memperbarui desain yang sudah dipasang di halaman Pengumuman; muat ulang halaman tersebut untuk melihat hasil terbaru.</p>
    <Link href="/admin/canva">Kembali ke pratinjau</Link>
  </>;
}
