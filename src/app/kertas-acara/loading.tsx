import { Box, Typography, CircularProgress } from "@mui/material";

export default function Loading() {
  return <div className="site-width">
    <header className="page-intro"><p className="eyebrow">IBADAH & PELAYANAN</p><h1>Kertas Acara</h1><p>Ikuti susunan ibadah dan lihat jadwal pelayanan jemaat.</p></header>
    <Box role="status" sx={{ py: 8, textAlign: "center" }}>
      <CircularProgress sx={{ color: "var(--site-blue)" }} />
      <Typography sx={{ mt: 2, color: "var(--site-muted)" }}>Memuat jadwal…</Typography>
    </Box>
  </div>;
}
