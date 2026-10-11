import { Alert, Box, Typography } from "@mui/material";
import { driveOAuthConfigured, getAccessToken } from "@/lib/drive";
import { isLocalDemo, isWeeklyDemo } from "@/lib/localDemo";
import DriveSettings from "@/components/admin/DriveSettings";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const demo = isLocalDemo();
  const params = await searchParams;
  let connected = false;
  if (!demo && driveOAuthConfigured()) {
    try {
      connected = Boolean(await getAccessToken());
    } catch { connected = false; }
  }
  return <>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 3 }}>Pengaturan</Typography>
    {params.drive === "error" && <Alert severity="error" sx={{ mb: 3 }}>Koneksi Google belum berhasil. Silakan coba lagi.</Alert>}
    <Box component="section" sx={{ py: 3, borderTop: "1px solid var(--site-border)", mb: 3 }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Google Drive</Typography>
      <DriveSettings demo={demo} configured={driveOAuthConfigured()} connected={connected} shared={Boolean(process.env.GOOGLE_DRIVE_REFRESH_TOKEN)} />
    </Box>
    <Box component="section" sx={{ py: 3, borderTop: "1px solid var(--site-border)" }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Google Sheets</Typography>
      <Typography>{isWeeklyDemo() ? "Formulir menggunakan data latihan lokal." : process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "Akses Sheets dikonfigurasi. Buka Kertas Acara untuk memeriksa akses." : "Kredensial Google Sheets belum dikonfigurasi."}</Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>Zona waktu gereja: Jakarta (WIB). Pergantian spreadsheet kuartal akan ditambahkan pada tahap berikutnya.</Typography>
    </Box>
  </>;
}
