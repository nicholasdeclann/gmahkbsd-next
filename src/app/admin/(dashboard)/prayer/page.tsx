"use client";
import { useCallback, useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Alert, CircularProgress, Checkbox, FormControlLabel } from "@mui/material";
import { emptyPrayerSlots, type PrayerSlot, type PrayerSnapshot } from "@/lib/prayerTypes";
import { formatChurchDate } from "@/lib/kertasAcaraForm";

export default function PrayerAdminPage() {
  const [snapshot, setSnapshot] = useState<PrayerSnapshot | null>(null);
  const [slots, setSlots] = useState<PrayerSlot[]>(emptyPrayerSlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dirty = Boolean(snapshot && JSON.stringify(snapshot.slots) !== JSON.stringify(slots));
  const load = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/prayer/manage", { cache: "no-store" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Daftar doa belum dapat dimuat.");
      setSnapshot(data); setSlots(data.slots);
    } catch (error) { setError(error instanceof Error ? error.message : "Daftar doa belum dapat dimuat."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update(index: number, change: Partial<PrayerSlot>) {
    setSuccess(""); setSlots(previous => previous.map((slot, i) => i === index ? { ...slot, ...change } : slot));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!snapshot || saving) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/prayer/manage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: snapshot.revision, slots }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Nama belum berhasil disimpan.");
      setSnapshot(data); setSlots(data.slots); setSuccess("Empat slot doa telah disimpan ke Kertas Acara. Alasan doa hanya disimpan untuk website.");
    } catch (error) { setError(error instanceof Error ? error.message : "Nama belum berhasil disimpan. Isian Anda tetap tersedia."); }
    finally { setSaving(false); }
  }
  return <Box sx={{ maxWidth: 760 }}>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>Pokok Doa</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Empat nama untuk setiap minggu, sesuai urutan pada Kertas Acara. Ganti nama di sini untuk minggu berikutnya. Slot boleh dikosongkan.</Typography>
    {snapshot?.date && <Typography sx={{ mb: 2, fontWeight: 600 }}>Tanggal Kertas Acara: {formatChurchDate(snapshot.date)}</Typography>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    {snapshot && !snapshot.canWrite && <Alert severity="info" sx={{ mb: 2 }}>Penyimpanan belum diaktifkan atau sel nama berisi rumus. Hubungi pengelola website.</Alert>}
    {snapshot && !snapshot.notesConfigured && <Alert severity="info" sx={{ mb: 2 }}>Nama dapat disimpan. Penyimpanan alasan doa belum diatur oleh pengelola website.</Alert>}
    {loading ? <CircularProgress aria-label="Memuat pokok doa" /> : snapshot && <Box component="form" onSubmit={save}>
      {slots.map((slot, index) => <Box component="section" key={index} sx={{ py: 3, borderTop: "1px solid var(--site-border)", mb: 2 }}>
        <Typography component="h2" variant="h6" sx={{ mb: 2 }}>Nama {index + 1}</Typography>
        <TextField fullWidth label={`Nama ${index + 1}`} value={slot.name} disabled={saving || !snapshot.canWrite} onChange={event => update(index, { name: event.target.value })} slotProps={{ htmlInput: { maxLength: 200 } }} helperText={`Disimpan sebagai “${index + 1}. Nama” pada Kertas Acara.`} />
        <TextField fullWidth multiline minRows={2} label="Alasan doa (opsional)" value={slot.note} disabled={saving || !snapshot.canWrite || !snapshot.notesConfigured} onChange={event => update(index, { note: event.target.value })} slotProps={{ htmlInput: { maxLength: 2000 } }} sx={{ mt: 2 }} helperText="Tidak dicantumkan di Kertas Acara." />
        <FormControlLabel control={<Checkbox checked={slot.note_public} disabled={saving || !snapshot.canWrite || !snapshot.notesConfigured} onChange={event => update(index, { note_public: event.target.checked })} />} label="Tampilkan alasan doa di website" />
      </Box>)}
      <Typography color="text.secondary" sx={{ mb: 2 }}>Nama muncul di website pada minggu tanggal Kertas Acara. Alasan doa yang tidak dicentang hanya terlihat oleh pengelola.</Typography>
      <Button type="submit" variant="contained" size="large" disabled={saving || !snapshot.canWrite || !dirty}>{saving ? "Menyimpan…" : "Simpan Pokok Doa"}</Button>
    </Box>}
    <Button sx={{ mt: 2, ml: 1 }} disabled={saving || loading} onClick={() => { if (!dirty || window.confirm("Muat ulang dan ganti isian yang belum disimpan dengan data terbaru?")) void load(); }}>Muat Ulang</Button>
  </Box>;
}
