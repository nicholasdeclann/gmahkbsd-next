"use client";
import LinkOutlined from "@mui/icons-material/LinkOutlined";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { sheetLink, type SheetSources } from "@/lib/sheetSources";
import type { SourcePreview } from "@/lib/previewSheetSources";

interface Settings { sources: SheetSources; previous?: SheetSources; revision: string; updatedAt?: string; demo: boolean; serviceEmail?: string }
export default function SpreadsheetSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mainLink, setMain] = useState(""), [participantLink, setParticipant] = useState("");
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [restore, setRestore] = useState(false);
  function adopt(value: Settings) {
    setSettings(current => ({ ...value, serviceEmail: value.serviceEmail ?? current?.serviceEmail })); setMain(sheetLink(value.sources.liturgy.sheetId, value.sources.liturgy.kertasAcaraGid));
    setParticipant(sheetLink(value.sources.schedule.sheetId, value.sources.schedule.gid)); setPreview(null);
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/sheet-settings", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error); if (!controller.signal.aborted) adopt(data);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof TypeError ? "Koneksi terputus. Muat ulang halaman." : error.message); });
    return () => controller.abort();
  }, []);
  async function request(mode: "preview" | "save" | "restore") {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/sheet-settings", { method: mode === "preview" ? "POST" : "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainLink, participantLink, revision: settings?.revision, restore: mode === "restore" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (mode === "preview") setPreview(data);
      else { adopt(data); setRestore(false); setSuccess(data.demo ? "Tautan tersimpan untuk latihan lokal. Website produksi tidak berubah." : "Tautan tersimpan. Halaman website memakai sumber baru paling lambat 15 detik setelah dimuat ulang."); }
    } catch (error) { setError(error instanceof TypeError ? "Koneksi terputus. Silakan coba lagi." : error instanceof Error ? error.message : "Pengaturan belum berhasil disimpan."); }
    finally { setBusy(false); }
  }
  const changed = () => { setPreview(null); setSuccess(""); setError(""); };
  return <Box component="section" sx={{ py: 3, borderTop: "1px solid var(--site-border)" }}>
    <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Tautan Spreadsheet</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Ganti tautan saat spreadsheet baru siap. Periksa pratinjau sebelum memakai sumber baru. Zona waktu: Jakarta (WIB).</Typography>
    {settings?.demo && <Typography variant="body2" color="text.secondary" sx={{mb:3}}>Perubahan hanya disimpan pada latihan lokal.</Typography>}
    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
    {!settings && error && <Button onClick={() => window.location.reload()}>Muat Ulang</Button>}
    {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
    {!settings && !error && <Typography>Memuat pengaturan…</Typography>}
    {settings && <>
      <TextField fullWidth label="Workbook Kertas Acara" value={mainLink} disabled={busy} onChange={event => { setMain(event.target.value); changed(); }} helperText="Berisi tab Kertas Acara, Lagu Sion, dan Jadwal Kuartal. Juga digunakan untuk nama Pokok Doa dan unduhan." sx={{ mb: 3 }} />
      <TextField fullWidth label="Spreadsheet peserta pelayanan per kuartal" value={participantLink} disabled={busy} onChange={event => { setParticipant(event.target.value); changed(); }} helperText="Buka tab Khotbah & SS pada spreadsheet peserta, lalu salin tautan lengkapnya. Ini terpisah dari tabel tahunan Jadwal Kuartal." sx={{ mb: 3 }} />
      <details className="quiet-disclosure"><summary>Bantuan akses spreadsheet</summary><Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>Workbook pengganti harus bisa dibaca oleh pengunjung website dan dibagikan kepada akun layanan {settings.serviceEmail || "Google Sheets gereja"} sebagai Editor. Tidak perlu mengubah sel atau rumus saat memeriksa tautan.</Typography></details>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Button startIcon={<LinkOutlined/>} variant="outlined" disabled={busy || !mainLink.trim() || !participantLink.trim()} onClick={() => void request("preview")}>{busy ? "Memeriksa…" : "Periksa Tautan"}</Button>
        {settings.previous && <Button disabled={busy} onClick={() => setRestore(true)}>Pulihkan Tautan Sebelumnya</Button>}
      </Box>
      {preview && <Box sx={{ borderTop: "1px solid var(--site-border)", pt: 3 }}>
        <Typography component="h3" variant="h6" sx={{ mb: 2 }}>Pratinjau sumber baru</Typography>
        <Typography sx={{ mb: 1 }}>Workbook: <strong>{preview.workbook}</strong></Typography>
        <Typography sx={{ mb: 1 }}>Tab terdeteksi: {preview.tabs.join(", ")}</Typography>
        <Typography sx={{ mb: 1 }}>Peserta: <strong>{preview.participants}</strong></Typography>
        <Typography sx={{ mb: 2 }}>Tanggal peserta: {preview.dates.join(", ")}</Typography>
        <Typography sx={{ mb: 2 }}>Sabat pada triwulan sekarang: {preview.quarterDates.length ? preview.quarterDates.join(", ") : "Belum tersedia"}</Typography>
        {preview.warnings.map(message => <Alert severity="warning" key={message} sx={{ mb: 2 }}>{message}</Alert>)}
        <Alert severity="success" sx={{ mb: 3 }}>Sumber dapat dibaca oleh website. Izin edit akun layanan untuk workbook Kertas Acara sudah tersedia.</Alert>
        <Button variant="contained" disabled={busy} onClick={() => void request("save")}>{busy ? "Menyimpan…" : "Gunakan Tautan Ini"}</Button>
      </Box>}
      {settings.updatedAt && <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>Terakhir disimpan: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(settings.updatedAt))} WIB</Typography>}
    </>}
    <Dialog open={restore} onClose={busy ? undefined : () => setRestore(false)}>
      <DialogTitle>Pulihkan tautan sebelumnya?</DialogTitle>
      <DialogContent><Typography>Website dan formulir akan kembali memakai kedua sumber sebelum penyimpanan terakhir. Akses spreadsheet akan diperiksa kembali.</Typography>
        {settings?.previous && <Box sx={{ mt: 2, overflowWrap: "anywhere" }}><Typography variant="body2">Workbook: {sheetLink(settings.previous.liturgy.sheetId, settings.previous.liturgy.kertasAcaraGid)}</Typography><Typography variant="body2" sx={{ mt: 1 }}>Peserta: {sheetLink(settings.previous.schedule.sheetId, settings.previous.schedule.gid)}</Typography></Box>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setRestore(false)}>Batal</Button><Button disabled={busy} onClick={() => void request("restore")}>Pulihkan</Button></DialogActions>
    </Dialog>
  </Box>;
}
