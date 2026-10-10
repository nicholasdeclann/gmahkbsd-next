"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Typography } from "@mui/material";

export default function DashboardShell({ children, demo, weeklyDemo }: { children: React.ReactNode; demo: boolean; weeklyDemo: boolean }) {
  const pathname = usePathname();
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
    } catch { setError("Belum berhasil keluar. Silakan coba lagi."); setLeaving(false); }
  }
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fb" }}>
      <Box component="header" sx={{ bgcolor: "white", borderBottom: "1px solid #e3e8ef" }}>
        <Container maxWidth="md" sx={{ py: 2.5, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ flex: 1 }}>
            <Typography component={Link} href="/admin" sx={{ color: "#18334d", textDecoration: "none", fontWeight: 750, fontSize: "1.25rem" }}>Dashboard Gereja</Typography>
            <Typography color="text.secondary" variant="body2">GMAHK BSD</Typography>
          </Box>
          <Button component={Link} href="/" variant="outlined">Lihat Website</Button>
          <Button onClick={logout} disabled={leaving} color="inherit">{leaving ? "Keluar…" : "Keluar"}</Button>
        </Container>
      </Box>
      <Container component="main" id="main-content" maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, "& .MuiButton-root": { minHeight: 46, textTransform: "none", fontSize: "1rem" }, "& .MuiInputBase-root": { bgcolor: "white" } }}>
        {pathname !== "/admin" && <Button component={Link} href="/admin" sx={{ mb: 2 }}>← Kembali ke Dashboard</Button>}
        {demo && <Alert severity="info" sx={{ mb: 3 }}>{weeklyDemo
          ? "Mode latihan lokal. Data yang disimpan di sini tidak mengubah spreadsheet atau website gereja."
          : "Kertas Acara dan Pokok Doa menggunakan Google Sheets gereja. Papan pengumuman masih dalam mode latihan lokal."}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {children}
        <Box component="footer" sx={{ mt: 5, pt: 3, borderTop: "1px solid #dfe5ed" }}>
          <Button component={Link} href="/admin/settings" color="inherit">Pengaturan</Button>
        </Box>
      </Container>
    </Box>
  );
}
