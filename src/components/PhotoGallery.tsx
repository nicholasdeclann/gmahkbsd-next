"use client";
import { AddPhotoAlternateOutlined } from "@/components/ui/icons";

import { T } from "@/components/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Typography, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Image from "next/image";
import PhotoCard from "./PhotoCard";
import PhotoUploadModal from "./PhotoUploadModal";
import PhotoEditModal from "./PhotoEditModal";
import AnnouncementShare from "./AnnouncementShare";
import type { AnnouncementItem } from "@/lib/announcementTypes";

export default function PhotoGallery({ editable = false, previewLimit }: { editable?: boolean; previewLimit?: number }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photos, setPhotos] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AnnouncementItem | null>(null);
  const [preview, setPreview] = useState<AnnouncementItem | null>(null);
  const [missingPost, setMissingPost] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<AnnouncementItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete() {
    if (!deletingPhoto || deleting) return;
    setDeleting(true); setDeleteError(""); setSuccess("");
    try {
      const response = await fetch("/api/photos/" + encodeURIComponent(deletingPhoto.id), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pengumuman belum berhasil dihapus.");
      setPhotos(prev => prev.filter(p => p.id !== deletingPhoto.id));
      if (preview?.id === deletingPhoto.id) setPreview(null);
      setDeletingPhoto(null);
      setSuccess("Pengumuman telah dihapus. Gambar dipindahkan ke sampah Google Drive.");
    } catch (error) { setDeleteError(error instanceof Error ? error.message : "Pengumuman belum berhasil dihapus."); }
    finally { setDeleting(false); }
  }

  const fetchPhotos = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/photos", { cache: "no-store", signal });
      if (!res.ok) throw new Error();
      const data: { photos: AnnouncementItem[]; configured: boolean } = await res.json();
      if (signal?.aborted) return;
      setPhotos(data.photos); setConfigured(data.configured);
      if (!editable && !previewLimit) {
        const id = new URL(window.location.href).searchParams.get("post");
        if (id) { const post = data.photos.find(p => p.id === id); setPreview(post ?? null); setMissingPost(!post); }
      }
    } catch {
      if (!signal?.aborted) setError("Pengumuman belum dapat dimuat. Silakan coba lagi.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [editable, previewLimit]);

  useEffect(() => { const controller = new AbortController(); void fetchPhotos(controller.signal); return () => controller.abort(); }, [fetchPhotos]);

  function captionSaved(updated: AnnouncementItem) {
    setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPhoto(null); setSuccess("Keterangan pengumuman telah diperbarui.");
  }
  function uploaded(post: AnnouncementItem) {
    setPhotos(prev => [post, ...prev]); setShowUpload(false);
    setSuccess("Pengumuman telah diterbitkan. Jemaat dapat melihatnya di halaman Pengumuman.");
  }

  return <>
    {!previewLimit && <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
      {!editable && <Box>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 450, mb: 1 }}><T text="Papan Pengumuman Jemaat" /></Typography>
        <Typography color="text.secondary"><T text="Informasi dan kegiatan dari seluruh departemen gereja." /></Typography>
      </Box>}
      {editable ? <Button variant="contained" startIcon={<AddPhotoAlternateOutlined/>} onClick={() => setShowUpload(true)}>Tambah Pengumuman</Button> : !previewLimit && <AnnouncementShare board />}
    </Box>}
    {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => void fetchPhotos()}><T text="Coba Lagi" /></Button>}><T text={error} /></Alert>}
    {missingPost && <Alert severity="info" sx={{ mb: 2 }}><T text="Pengumuman pada tautan ini belum tersedia. Lihat pengumuman lainnya di bawah." /></Alert>}
    {editable && !configured && <Alert severity="info" sx={{ mb: 2 }} action={<Button href="/admin/settings">Pengaturan</Button>}>Hubungkan folder pengumuman di Google Drive sebelum menerbitkan gambar.</Alert>}
    {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress aria-label="Memuat pengumuman" /></Box> :
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: editable ? "repeat(2, 1fr)" : "repeat(3, 1fr)" }, gap: 3 }}>
        {!photos.length && !error && <Box sx={{ py: 4, gridColumn: "1 / -1", borderTop: "1px solid var(--site-border)" }}>
          <Typography color="text.secondary"><T text="Belum ada pengumuman tambahan." /></Typography>
          {editable && <Typography color="text.secondary" sx={{ mt: 1 }}>Tambahkan gambar dan keterangan untuk dibaca jemaat.</Typography>}
        </Box>}
        {(previewLimit ? photos.slice(0, previewLimit) : photos).map(photo => <PhotoCard key={photo.id} photo={photo} onOpen={() => setPreview(photo)} onEdit={editable ? () => setEditingPhoto(photo) : undefined}
          onDelete={editable && !/^\d+$/.test(photo.id) ? () => { setDeleteError(""); setDeletingPhoto(photo); } : undefined} />)}
      </Box>}
    {editable && showUpload && <PhotoUploadModal onClose={() => setShowUpload(false)} onUploaded={uploaded} />}
    {editable && editingPhoto && <PhotoEditModal photoId={editingPhoto.id} currentCaption={editingPhoto.caption} onClose={() => setEditingPhoto(null)} onSaved={captionSaved} />}
    {editable && <Dialog open={Boolean(deletingPhoto)} onClose={deleting ? undefined : () => setDeletingPhoto(null)} maxWidth="sm" fullWidth aria-labelledby="delete-announcement-title">
      <DialogTitle id="delete-announcement-title">Hapus Pengumuman?</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{deletingPhoto?.caption || `Pengumuman ${deletingPhoto?.department || ""}`}</Typography>
        <Typography>Pengumuman akan hilang dari papan jemaat. File gambarnya dipindahkan ke sampah Google Drive dan dapat dipulihkan dari sana.</Typography>
        {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={() => setDeletingPhoto(null)} disabled={deleting}><T text="Batal" /></Button>
        <Button variant="contained" color="error" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? "Menghapus…" : "Hapus Pengumuman"}</Button>
      </DialogActions>
    </Dialog>}
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth aria-labelledby="announcement-preview-title">
      <DialogTitle id="announcement-preview-title"><T text="Pengumuman" />{preview?.department}</DialogTitle>
      <DialogContent>
        {preview && <>
          <Image src={preview.image_url} alt={preview.caption || "Pengumuman " + preview.department} width={1200} height={1600} unoptimized
            style={{ width: "100%", height: "auto", maxHeight: "75vh", objectFit: "contain" }} />
          {preview.caption && <Typography sx={{ mt: 2, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{preview.caption}</Typography>}
        </>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {preview && <AnnouncementShare id={preview.id} caption={preview.caption} />}
        <Button variant="outlined" onClick={() => setPreview(null)}><T text="Tutup" /></Button>
      </DialogActions>
    </Dialog>
  </>;
}
