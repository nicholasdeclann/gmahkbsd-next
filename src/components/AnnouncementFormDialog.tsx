"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";
import { announcementDetails, announcementPatch, nextSabbath, todayJakarta, ANNOUNCEMENT_IMAGE_TYPES, ANNOUNCEMENT_MAX_BYTES, type AnnouncementItem } from "@/lib/announcementTypes";
import { posterDate, type PosterAssignments } from "@/lib/sabbathPosterTypes";
import { useActionNotice } from "./ui/notifications/NotificationProvider";
import StatusNote from "./ui/notifications/StatusNote";
import { useLanguage } from "./LanguageProvider";
import GlassDialog from "./ui/glass/GlassDialog";
import ConfirmDialog from "./ui/glass/ConfirmDialog";
import { GlassButton } from "./ui/glass/GlassControls";
import { SaveOutlined, Refresh } from "./ui/icons";
import FilledImage from "./ui/glass/FilledImage";
import DueDateField from "./ui/glass/DueDateField";
import "./sabbath-poster.css";

type AssignmentInfo = PosterAssignments & { posters: Pick<AnnouncementItem, "id" | "title" | "image_url">[] };
export default function AnnouncementFormDialog({ post, onClose, onSaved }: { post?: AnnouncementItem; onClose: () => void; onSaved: (post: AnnouncementItem) => void }) {
  const { t } = useLanguage(), legacy = Boolean(post && /^\d+$/.test(post.id));
  const [title, setTitle] = useState(post?.title || ""), [caption, setCaption] = useState(post?.caption || ""), [department, setDepartment] = useState(post?.department || "");
  const [due, setDue] = useState(post?.due_date || nextSabbath()), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false), [, setError] = useActionNotice("error");
  const [enabled, setEnabled] = useState(Boolean(post?.replacement_date)), [date, setDate] = useState(post?.replacement_date || nextSabbath());
  const [assignments, setAssignments] = useState<AssignmentInfo | null>(null), [assignmentError, setAssignmentError] = useState(false);
  const [conflict, setConflict] = useState<AssignmentInfo["posters"][number] | null>(null);
  // Retain the uploaded ID after a later assignment failure, so retry never uploads a duplicate.
  const persisted = useRef<AnnouncementItem | undefined>(post), dueRef = useRef<HTMLDivElement>(null);
  const loadAssignments = useCallback(async () => {
    setAssignmentError(false);
    try {
      const response = await fetch("/api/admin/sabbath-posters", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json(); setAssignments(data); return data as AssignmentInfo;
    } catch { setAssignments(null); setAssignmentError(true); return null; }
  }, []);
  useEffect(() => { if (!legacy) void loadAssignments(); }, [loadAssignments, legacy]);
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  useEffect(() => { if (post?.expired || post && !post.due_date) dueRef.current?.querySelector("input")?.focus(); }, [post]);
  async function save(confirmed = false) {
    if (busy) return; setError("");
    let details;
    try {
      details = persisted.current ? announcementPatch(legacy ? { caption } : { title, caption, department, due_date: due }) : announcementDetails({ title, caption, department, due_date: due });
      if (!persisted.current && (!file || !ANNOUNCEMENT_IMAGE_TYPES.includes(file.type))) throw new Error("Pilih gambar JPG, PNG, atau WebP.");
      if (file && file.size > ANNOUNCEMENT_MAX_BYTES) throw new Error("Ukuran gambar maksimal 4 MB.");
      if (enabled) {
        posterDate(date);
        if (due < date) throw new Error("Tanggal berakhir pengumuman harus pada atau setelah Sabat yang dipilih.");
      }
      if (!legacy && !assignments) throw new Error("Penetapan poster belum dapat dimuat. Silakan coba lagi.");
    } catch (error) { setError(t((error as Error).message)); return; }
    const current = assignments?.assignments[date];
    if (enabled && current && current !== persisted.current?.id && !confirmed) {
      setConflict(assignments!.posters.find(poster => poster.id === current) ?? { id: current, title: t("Poster sebelumnya"), image_url: "" }); return;
    }
    setConflict(null); setBusy(true);
    try {
      const oldDate = Object.keys(assignments?.assignments ?? {}).find(key => assignments?.assignments[key] === persisted.current?.id);
      const deferExpiry = Boolean(oldDate && due < oldDate && (!enabled || date < oldDate));
      const firstDetails = deferExpiry ? { ...details, due_date: persisted.current!.due_date } : details;
      let response;
      if (persisted.current) response = await fetch("/api/photos/" + encodeURIComponent(persisted.current.id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(firstDetails) });
      else {
        const form = new FormData(); form.append("file", file!);
        for (const [key, value] of Object.entries(details)) form.append(key, String(value ?? ""));
        response = await fetch("/api/photos/upload", { method: "POST", body: form });
      }
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Pengumuman belum berhasil disimpan.");
      persisted.current = data.photo;
      const previousDate = Object.keys(assignments?.assignments ?? {}).find(key => assignments?.assignments[key] === data.photo.id);
      if (!legacy && (enabled || previousDate)) {
        const assignment = await fetch("/api/admin/sabbath-posters", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: enabled ? date : previousDate, id: enabled ? data.photo.id : null, revision: assignments!.revision }) });
        const result = await assignment.json();
        if (!assignment.ok) { await loadAssignments(); throw new Error(result.error || "Penetapan poster belum berhasil. Refresh lalu coba lagi."); }
      }
      if (deferExpiry) {
        const final = await fetch("/api/photos/" + encodeURIComponent(data.photo.id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ due_date: due }) });
        const result = await final.json();
        if (!final.ok) { await loadAssignments(); throw new Error(result.error || "Pengumuman belum berhasil disimpan."); }
        data.photo = result.photo; persisted.current = result.photo;
      }
      onSaved({ ...data.photo, replacement_date: enabled ? date : null, replacement_active: enabled });
    } catch (error) { setError(t(error instanceof Error ? error.message : "Pengumuman belum berhasil disimpan.")); }
    finally { setBusy(false); }
  }
  return <>
    <GlassDialog open onClose={onClose} title={post ? "Edit Pengumuman" : "Tambah Pengumuman"} busy={busy} size="md" actions={<GlassButton tone="primary" startIcon={post ? <SaveOutlined /> : undefined} disabled={busy || (!legacy && !assignments)} onClick={() => void save()}>{t(busy ? "Menyimpan…" : post ? "Simpan" : "Terbitkan Pengumuman")}</GlassButton>}>
      <div className="announcement-form">
        {!post && !persisted.current && <label>{t("Gambar Pengumuman")}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} /><small>JPG / PNG / WebP · 4 MB</small></label>}
        {(preview || post) && <FilledImage src={preview || post!.image_url} alt={t("Pratinjau gambar pengumuman")} adaptive />}
        <TextField label={t("Judul pengumuman")} value={title} onChange={event => setTitle(event.target.value)} disabled={busy || legacy} fullWidth required={!legacy} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <TextField label={t("Departemen (opsional)")} value={department} onChange={event => setDepartment(event.target.value)} disabled={busy || legacy} fullWidth />
        <TextField label={t("Keterangan (opsional)")} multiline minRows={3} value={caption} onChange={event => setCaption(event.target.value)} disabled={busy} fullWidth slotProps={{ htmlInput: { maxLength: 2000 } }} helperText={enabled ? t("Cantumkan tanggal, jam, dan lokasi agar jadwal dapat dibaca tanpa gambar.") : undefined} />
        {!legacy && <>
          <div ref={dueRef}><DueDateField autoFocus={Boolean(post?.expired || post && !post.due_date)} value={due} onChange={setDue} disabled={busy} min={post ? undefined : todayJakarta()} /></div>
          <div className="announcement-replacement">
            <FormControlLabel control={<Checkbox checked={enabled} onChange={event => setEnabled(event.target.checked)} disabled={busy || !assignments} />} label={t("Gunakan sebagai Kertas Acara")} />
            {enabled && <><TextField type="date" label={t("Tanggal Sabat")} value={date} onChange={event => { setDate(event.target.value); if (event.target.value > due) setDue(event.target.value); }} disabled={busy} fullWidth slotProps={{ inputLabel: { shrink: true } }} /><p>{t("Menggantikan susunan ibadah untuk Sabat yang dipilih.")}</p></>}
            {assignmentError && <><p>{t("Penetapan poster belum dapat dimuat. Silakan coba lagi.")}</p><GlassButton startIcon={<Refresh />} onClick={() => void loadAssignments()}>{t("Refresh")}</GlassButton></>}
          </div>
        </>}
        {legacy && <StatusNote severity="info">{t("Pengumuman lama ini hanya mendukung perubahan keterangan.")}</StatusNote>}
      </div>
    </GlassDialog>
    <ConfirmDialog open={Boolean(conflict)} onClose={() => setConflict(null)} title="Ganti Poster" subject={conflict?.title} message={<>{conflict?.image_url && <img className="poster-confirm-preview" src={conflict.image_url} alt={conflict.title} />}<p>{t("Poster ini sudah digunakan untuk Sabat yang dipilih. Ganti dengan pengumuman yang sedang diedit? Keduanya tetap ada di Pengumuman.")}</p></>} confirmLabel="Ganti Poster" tone="primary" onConfirm={() => void save(true)} busy={busy} />
  </>;
}
