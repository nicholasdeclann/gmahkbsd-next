

import { Alert, Box, Typography } from "@mui/material";

import { isWeeklyDemo } from "@/lib/localDemo";
import GoogleConnectionHealth from "@/components/admin/GoogleConnectionHealth";


export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const params = await searchParams;
  return <>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 3 }}>Koneksi Google</Typography>
    {params.drive === "error" && <Alert severity="error" sx={{ mb: 3 }}>Koneksi Google belum berhasil. Silakan coba lagi.</Alert>}
    <div className="settings-panels">
    <Box component="section" className="settings-panel">
      <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Google Drive</Typography>
      <GoogleConnectionHealth/>
    </Box>
    <Box component="section" className="settings-panel">
      <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Google Sheets</Typography>
      <Typography>{isWeeklyDemo() ? "Formulir menggunakan data latihan lokal." : process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "Akses Sheets dikonfigurasi. Buka Kertas Acara untuk memeriksa akses." : "Kredensial Google Sheets belum dikonfigurasi."}</Typography>
    </Box>
    </div>
  </>;
}
