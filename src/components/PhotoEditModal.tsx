"use client";
import { useState } from "react";
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import type { AnnouncementItem } from "@/lib/announcementTypes";

export default function PhotoEditModal({ photoId, currentCaption, onClose, onSaved }: {
  photoId: string; currentCaption: string | null; onClose: () => void; onSaved: (photo: AnnouncementItem) => void;
}) {
  const [caption, setCaption] = useState(currentCaption || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/photos/" + encodeURIComponent(photoId), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Keterangan belum berhasil disimpan.");
      onSaved(data.photo);
    } catch (error) { setError(error instanceof Error ? error.message : "Keterangan belum berhasil disimpan."); }
    finally { setSaving(false); }
  }
  return <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="edit-announcement-title">
    <DialogTitle id="edit-announcement-title">Ubah Keterangan Pengumuman</DialogTitle>
    <DialogContent>
      <TextField label="Keterangan" fullWidth multiline minRows={4} value={caption} onChange={event => setCaption(event.target.value)}
        disabled={saving} slotProps={{ htmlInput: { maxLength: 2000 } }} sx={{ mt: 1 }} helperText="Perubahan langsung ditampilkan kepada jemaat." />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button onClick={onClose} disabled={saving}>Batal</Button>
      <Button variant="contained" onClick={() => void save()} disabled={saving || caption === (currentCaption || "")}>{saving ? "Menyimpan…" : "Simpan Perubahan"}</Button>
    </DialogActions>
  </Dialog>;
}
