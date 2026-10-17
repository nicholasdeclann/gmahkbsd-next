"use client";
import { useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, Typography } from "@mui/material";
import type { CanvaPreview } from "@/lib/canvaPreview";
import { CANVA_DESIGN_ID } from "@/lib/canvaPreview";
type Preview = CanvaPreview & { revision: string; demo: boolean };
type Connection = { ready: boolean; configured: boolean; message: string };
export default function CanvaSync() {
  const [preview, setPreview] = useState<Preview | null>(null), [connection, setConnection] = useState<Connection | null>(null);
  const [selected, setSelected] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [job, setJob] = useState("");
  async function load(signal?: AbortSignal) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/canva", { cache: "no-store", signal }), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPreview(data.preview); setConnection(data.connection); setSelected([]);
    } catch (err) { if (!signal?.aborted) { setError(err instanceof Error ? err.message : "Pratinjau belum dapat dimuat."); setPreview(null); } }
    finally { if (!signal?.aborted) setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);
  useEffect(() => {
    if (!job) return;
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>; let attempts = 0;
    async function poll() {
      try {
        const response = await fetch(`/api/admin/canva?job=${encodeURIComponent(job)}`, { cache: "no-store", signal: controller.signal }), data = await response.json();
        if (!response.ok || data.status === "failed") throw new Error(data.error || "Sinkronisasi gagal.");
        if (data.status === "success") { setMessage("Presentasi Canva berhasil diperbarui. Buka Canva untuk memeriksa tata letaknya."); setJob(""); return; }
        if (++attempts >= 60) throw new Error("Canva masih memproses. Periksa presentasi sebelum mencoba sinkronisasi lagi.");
        timer = setTimeout(poll, 3000);
      } catch (err) { if (!controller.signal.aborted) { setError(err instanceof Error ? err.message : "Status Canva belum tersedia. Periksa presentasi sebelum mencoba lagi."); setJob(""); } }
    }
    timer = setTimeout(poll, 2000); return () => { controller.abort(); clearTimeout(timer); };
  }, [job]);
  async function connect() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/canva/auth", { method: "POST" }), data = await response.json(); if (!response.ok) throw new Error(data.error); window.location.assign(data.url); }
    catch (err) { setError(err instanceof Error ? err.message : "Koneksi Canva gagal."); setBusy(false); }
  }
  async function sync() {
    if (!preview) return; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/canva", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: preview.revision, announcementIds: selected }) }), data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.status === "failed") throw new Error("Sinkronisasi Canva gagal.");
      if (data.status === "success") setMessage("Presentasi Canva berhasil diperbarui. Buka Canva untuk memeriksa tata letaknya."); else setJob(data.job);
    } catch (err) { setError(err instanceof Error ? err.message : "Periksa presentasi sebelum mencoba sinkronisasi lagi."); }
    finally { setBusy(false); }
  }
  const locked = busy || Boolean(job);
  return <>
    <Typography component="h1" variant="h4" sx={{ mb: 1 }}>Presentasi Canva</Typography>
    <Typography sx={{ mb: 3 }}>Pratinjau data pelayanan Sabat berikutnya dan Pokok Doa minggu ini sebelum memperbarui presentasi.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {connection && <Alert severity={connection.ready ? "info" : "warning"} sx={{ mb: 2 }}>{connection.message} <a href="/admin/canva/setup">Panduan pengaturan</a></Alert>}
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
      <Button variant="outlined" onClick={() => void load()} disabled={locked}>Perbarui Pratinjau</Button>
      {connection?.configured && <Button onClick={() => void connect()} disabled={locked}>Hubungkan Canva</Button>}
      <Button href={`https://www.canva.com/design/${CANVA_DESIGN_ID}/edit`} target="_blank" rel="noopener noreferrer">Buka Canva</Button>
    </Box>
    {busy && <CircularProgress aria-label="Memuat Canva"/>}
    {job && <Alert severity="info">Canva sedang memperbarui presentasi. Jangan tutup halaman sampai status selesai.</Alert>}
    {preview && <>
      {preview.demo && <Alert severity="info" sx={{ mb: 2 }}>Mode latihan: pratinjau dapat dilihat, tetapi sinkronisasi ke Canva dinonaktifkan.</Alert>}
      {preview.warnings.map(warning => <Alert severity="warning" key={warning} sx={{ mb: 1 }}>{warning}</Alert>)}
      {preview.blockingErrors.map(warning => <Alert severity="error" key={warning} sx={{ mb: 1 }}>{warning}</Alert>)}
      <Alert severity="info" sx={{ my: 2 }}>Jadwal spreadsheet yang terhubung berisi pelayanan Sabat. Nama dan tanggal Rabu Malam serta Vesper tetap diperbarui langsung di Canva.</Alert>
      <Typography component="h2" variant="h5" sx={{ mt: 3 }}>Pelayanan · {preview.nextDate}</Typography>
      <Box component="dl">{preview.participants.map(item => <Box key={item.field} sx={{ mb: 2 }}><Typography component="dt" fontWeight={600}>{item.label}</Typography><Typography component="dd" sx={{ m: 0 }}>{item.value || "Belum diisi"}</Typography><Typography variant="caption" color="text.secondary">Field Canva: {item.field}</Typography></Box>)}</Box>
      <Typography component="h2" variant="h5">Pokok Doa · {preview.date}</Typography>
      <Typography color="text.secondary">Menggunakan isian admin untuk Sabat minggu ini. Alasan doa pribadi tidak disertakan.</Typography>
      {preview.prayers.map((item, index) => <Box key={index} sx={{ my: 2 }}><Typography fontWeight={600}>{item.name || "Slot kosong"}</Typography>{item.note && <Typography sx={{ whiteSpace: "pre-wrap" }}>{item.note}</Typography>}</Box>)}
      <Typography component="h2" variant="h5" sx={{ mt: 3 }}>Pilih Pengumuman</Typography>
      <Typography color="text.secondary">Pilih keterangan pengumuman yang akan dimasukkan. Poster/gambar tetap dikelola di Canva.</Typography>
      {!preview.announcements.length && <Typography sx={{ my: 2 }}>Belum ada pengumuman.</Typography>}
      {preview.announcements.map(item => <Box key={item.id} sx={{ my: 2 }}><FormControlLabel control={<Checkbox disabled={locked || (!selected.includes(item.id) && selected.length >= 20) || !item.caption} checked={selected.includes(item.id)} onChange={(_, checked) => setSelected(current => checked ? [...current, item.id] : current.filter(id => id !== item.id))}/>} label={`${item.department}: ${item.caption || "Belum ada keterangan teks"}`}/></Box>)}
      <Button variant="contained" sx={{ mt: 3 }} disabled={locked || preview.demo || !connection?.ready || Boolean(preview.blockingErrors.length)} onClick={() => void sync()}>Sync to Canva</Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Memperbarui presentasi Pengumuman yang ditampilkan di website. Periksa data di atas sebelum sinkronisasi.</Typography>
    </>}
  </>;
}
