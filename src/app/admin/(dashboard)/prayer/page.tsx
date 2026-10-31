"use client";
import StatusNote from "@/components/ui/notifications/StatusNote";

import { useActionNotice } from "@/components/ui/notifications/NotificationProvider";
import ConfirmDialog from "@/components/ui/glass/ConfirmDialog";
import { SaveOutlined, Refresh } from "@/components/ui/icons";
import { GlassButton } from "@/components/ui/glass/GlassControls";

import { useCallback, useEffect, useState } from "react";
import { Box, Typography, TextField, CircularProgress } from "@mui/material";
import { emptyPrayerSlots, type PrayerSlot, type PrayerSnapshot } from "@/lib/prayerTypes";
import { formatChurchDate } from "@/lib/kertasAcaraForm";

export default function PrayerAdminPage() {
  const [snapshot, setSnapshot] = useState<PrayerSnapshot | null>(null);
  const [slots, setSlots] = useState<PrayerSlot[]>(emptyPrayerSlots);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadConfirm,setReloadConfirm]=useState(false);
  const [error,setError]=useActionNotice("error");
  const [success,setSuccess]=useActionNotice("success");
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
      setSnapshot(data); setSlots(data.slots); setSuccess("Nama telah disimpan ke Kertas Acara.");
    } catch (error) { setError(error instanceof Error ? error.message : "Nama belum berhasil disimpan. Isian Anda tetap tersedia."); }
    finally { setSaving(false); }
  }
  return <Box sx={{ maxWidth: 760 }}>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>Pokok Doa</Typography>
    {snapshot?.date && <Typography color="text.secondary" sx={{ mb: 2 }}>{formatChurchDate(snapshot.date)}</Typography>}


    {snapshot && !snapshot.canWrite && <StatusNote severity="info" sx={{ mb: 2 }}>Penyimpanan belum diaktifkan atau sel nama berisi rumus. Hubungi pengelola website.</StatusNote>}
    {loading ? <CircularProgress aria-label="Memuat pokok doa" /> : snapshot && <Box component="form" onSubmit={save}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
        {slots.map((slot, index) => <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, border: "1px solid var(--site-border)", borderRadius: "18px", bgcolor: "var(--site-surface)", minWidth: 0 }}>
          <Box aria-hidden="true" sx={{ display: "grid", placeItems: "center", width: 32, height: 32, flexShrink: 0, borderRadius: "50%", bgcolor: "var(--glass-field)", color: "text.secondary" }}>{index + 1}</Box>
          <TextField fullWidth label={`Nama ${index + 1}`} size="small" value={slot.name} disabled={saving || !snapshot.canWrite} onChange={event => update(index, { name: event.target.value })} slotProps={{ htmlInput: { maxLength: 200 }, input: { sx: { minHeight: 48 } } }} />
        </Box>)}
      </Box>
      <Typography color="text.secondary" variant="body2" sx={{ mt: 1.5, mb: 2 }}>Urutan sesuai Kertas Acara. Slot boleh kosong.</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <GlassButton startIcon={<SaveOutlined/>} tone="primary" type="submit" disabled={saving || !snapshot.canWrite || !dirty}>{saving ? "Menyimpan…" : "Simpan"}</GlassButton>
        <GlassButton startIcon={<Refresh/>} disabled={saving || loading} onClick={() => { if(dirty)setReloadConfirm(true);else void load(); }}>Refresh</GlassButton>
      </Box>
    </Box>}
    {!loading && !snapshot && <GlassButton startIcon={<Refresh/>} onClick={()=>void load()}>Refresh</GlassButton>}
    <ConfirmDialog open={reloadConfirm} onClose={()=>setReloadConfirm(false)} onConfirm={()=>{setReloadConfirm(false);void load();}} title="Refresh?" message="Ganti isian yang belum disimpan dengan data terbaru?" confirmLabel="Refresh" tone="primary"/>
  </Box>;
}
