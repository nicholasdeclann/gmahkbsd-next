"use client";
import { useActionNotice } from "@/components/ui/notifications/NotificationProvider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, TextField, Button } from "@mui/material";
import Link from "next/link";
import { ArrowBack } from "@/components/ui/icons";
import DisplaySettings from "@/components/DisplaySettings";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error,setError]=useActionNotice("error");
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
    <Container maxWidth="xs" className="login-page">
      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:3}}><Button component={Link} href="/" startIcon={<ArrowBack/>}>Kembali ke Website</Button><DisplaySettings/></Box>
      <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 3, textAlign: "center" }}>
        Dashboard Staf
      </Typography>
      <Typography color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>Masuk dengan kata sandi staf.</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

        <TextField
          type="password"
          error={Boolean(error)}
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
        <Button href="/tamu" variant="outlined" fullWidth>Penerima Tamu</Button>
        <Button href="/tamu/mc" variant="outlined" fullWidth sx={{mt:1.5}}>Tampilan MC</Button>
        <Typography variant="body2" color="text.secondary" sx={{mt:1}}>Daftar tamu dapat diisi tanpa kata sandi.</Typography>
      </Box>
    </Container>
  );
}
