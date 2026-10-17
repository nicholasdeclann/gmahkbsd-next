"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import Link from "next/link";
import ArrowBack from "@mui/icons-material/ArrowBack";
import DisplaySettings from "@/components/DisplaySettings";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal masuk");
      }
      // Return to the page that sent them here (e.g. /pengumuman?next=...),
      // but only accept same-site paths to avoid an open redirect.
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next && /^\/admin(?:\/|$)/.test(next) && !next.includes("\\") && !next.startsWith("/admin/login")
        ? next
        : "/admin";
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 8, sm: 12 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}><Button component={Link} href="/" startIcon={<ArrowBack/>} sx={{textTransform:"none"}}>Kembali ke Website</Button><DisplaySettings /></Box>
      <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 3, textAlign: "center" }}>
        Dashboard Gereja
      </Typography>
      <Typography color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>Masukkan kata sandi yang diberikan oleh pengelola gereja.</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          type="password"
          label="Kata Sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          required
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={loading || !password}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </Box>
      <Box sx={{mt:4,pt:3,borderTop:"1px solid var(--site-border)",textAlign:"center"}}>
        <Button href="/tamu" variant="outlined" fullWidth>Daftar Tamu · Penerima Tamu</Button>
        <Button href="/tamu/mc" variant="outlined" fullWidth sx={{mt:1.5}}>Daftar Tamu untuk MC</Button>
        <Typography variant="body2" color="text.secondary" sx={{mt:1}}>Daftar tamu dapat diisi tanpa kata sandi.</Typography>
      </Box>
    </Container>
  );
}
