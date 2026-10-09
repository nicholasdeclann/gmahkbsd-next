"use client";
import { useState } from "react";
import { Alert, Button, Typography } from "@mui/material";

export default function DriveSettings({ configured, connected, shared, demo }: { configured: boolean; connected: boolean; shared: boolean; demo: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function connect() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/drive/auth/login", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(data.authUrl);
    } catch (error) { setError(error instanceof Error ? error.message : "Koneksi belum berhasil. Coba lagi."); setLoading(false); }
  }
  return <>
    <Alert severity={connected ? "success" : "info"} sx={{ mb: 2 }}>{demo ? "Mode latihan tidak terhubung ke Google Drive." : connected ? shared ? "Koneksi Drive bersama tersedia." : "Google Drive terhubung pada browser ini." : "Google Drive belum terhubung."}</Alert>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Koneksi Google hanya diperlukan untuk penyimpanan file. Staff tetap masuk ke dashboard dengan kata sandi.</Typography>
    {!shared && !demo && <Typography color="text.secondary" sx={{ mb: 2 }}>Pada tahap awal ini, koneksi melalui tombol berlaku pada browser ini. Koneksi bersama perlu disiapkan oleh pengelola website.</Typography>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {!demo && !shared && <Button variant="outlined" disabled={!configured || loading} onClick={() => void connect()}>{loading ? "Menghubungkan…" : connected ? "Sambungkan Ulang Google Drive" : "Hubungkan Google Drive"}</Button>}
  </>;
}
