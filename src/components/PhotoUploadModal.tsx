"use client";
import { useEffect, useState } from "react";
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from "@mui/material";
import Image from "next/image";
import { announcementDetails, ANNOUNCEMENT_IMAGE_TYPES, ANNOUNCEMENT_MAX_BYTES, type AnnouncementItem } from "@/lib/announcementTypes";

export default function PhotoUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (photo: AnnouncementItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [department, setDepartment] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [needsDrive, setNeedsDrive] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleUpload() {
    if (!file) { setError("Pilih gambar pengumuman terlebih dahulu."); return; }
    if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) { setError("Gunakan gambar JPG, PNG, atau WebP."); return; }
    if (file.size > ANNOUNCEMENT_MAX_BYTES) { setError("Ukuran gambar maksimal 4 MB."); return; }
    let details;
    try { details = announcementDetails(department, caption); }
    catch (error) { setError((error as Error).message); return; }
    setUploading(true); setError(""); setNeedsDrive(false);
    try {
      const form = new FormData();
      form.append("file", file); form.append("department", details.department); form.append("caption", details.caption || "");
      const response = await fetch("/api/photos/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && data.code === "ADMIN_REQUIRED") {
        window.location.href = "/admin/login?next=/admin/photos"; return;
      }
      if (!response.ok) {
        setNeedsDrive(data.code === "DRIVE_NOT_CONNECTED" || response.status === 503);
        throw new Error(data.error || "Pengumuman belum berhasil diterbitkan.");
      }
      onUploaded(data.photo);
    } catch (error) { setError(error instanceof Error ? error.message : "Pengumuman belum berhasil diterbitkan."); }
    finally { setUploading(false); }
  }

  return <Dialog open onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="new-announcement-title">
    <DialogTitle id="new-announcement-title">Tambah Pengumuman</DialogTitle>
    <DialogContent>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Pengumuman yang diterbitkan langsung dapat dilihat dan dibagikan oleh jemaat.</Typography>
      <Box component="label" sx={{ display: "block", mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Gambar Pengumuman</Typography>
        <input type="file" aria-label="Gambar Pengumuman" accept="image/jpeg,image/png,image/webp" disabled={uploading}
          style={{ width: "100%", fontSize: "1rem" }} onChange={event => { setFile(event.target.files?.[0] || null); setError(""); }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>JPG, PNG, atau WebP · maksimal 4 MB</Typography>
      </Box>
      {preview && <Image src={preview} alt="Pratinjau gambar pengumuman" width={600} height={450} unoptimized style={{ width: "100%", height: 220, objectFit: "contain", marginBottom: 24 }} />}
      <TextField label="Departemen (opsional)" fullWidth value={department} onChange={event => setDepartment(event.target.value)}
        disabled={uploading} placeholder="Contoh: Pemuda, Pelayanan Wanita, Sekolah Sabat"
        helperText="Kosongkan untuk pengumuman umum. Semua departemen dapat mengirim." sx={{ mb: 3 }} />
      <TextField label="Keterangan (opsional)" fullWidth multiline minRows={3} value={caption}
        onChange={event => setCaption(event.target.value)} disabled={uploading}
        helperText="Tuliskan informasi kegiatan, tanggal, atau kontak yang boleh dibaca jemaat."
        slotProps={{ htmlInput: { maxLength: 2000 } }} />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
      {needsDrive && <Button href="/admin/settings">Buka Pengaturan</Button>}
      <Button onClick={onClose} disabled={uploading}>Batal</Button>
      <Button variant="contained" onClick={() => void handleUpload()} disabled={!file || uploading}>
        {uploading ? "Menerbitkan…" : "Terbitkan Pengumuman"}
      </Button>
    </DialogActions>
  </Dialog>;
}
