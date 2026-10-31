"use client";
import StatusNote from "@/components/ui/notifications/StatusNote";

import { useActionNotice, useNotifications } from "@/components/ui/notifications/NotificationProvider";
import { GlassButton } from "../ui/glass/GlassControls";
import ConfirmDialog from "../ui/glass/ConfirmDialog";
import { useLanguage } from "../LanguageProvider";
import "./WeeklyForm.css";
import { SaveOutlined, Refresh, OpenInNew, ContentCopy } from "../ui/icons";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Close from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { Autocomplete, Box, Button, CircularProgress, Menu, MenuItem, TextField, Typography } from "@mui/material";
import { formatChurchDate, rollForwardSabbath, type WeeklySnapshot, type WeeklyValues } from "@/lib/kertasAcaraForm";
import { parseKertasAcaraPaste } from "@/lib/kertasAcaraPaste";

const PASTE_TEMPLATE = `Judul Khotbah :
Ayat Inti :
Ayat Bersahutan :
Lagu Buka :
Lagu Tutup : `;

export default function WeeklyForm() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { notify, dismiss } = useNotifications();
  const [snapshot, setSnapshot] = useState<WeeklySnapshot | null>(null);
  const [values, setValues] = useState<WeeklyValues | null>(null);
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [error,setError]=useActionNotice("error");
  const [success,setSuccess]=useActionNotice("success");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const alive = useRef(true);
  const [pasteText, setPasteText] = useState("");
  const [appliedPaste, setAppliedPaste] = useState("");

  async function copyTemplate() {
    dismiss("weekly-copy");
    try {
      await navigator.clipboard.writeText(PASTE_TEMPLATE);
      if (!alive.current) return;
      notify({ type: "success", key: "weekly-copy", message: t("Format berhasil disalin.") });
    } catch {
      if (!alive.current) return;
      notify({ type: "error", key: "weekly-copy", message: t("Format belum dapat disalin. Coba lagi atau salin contoh pada kolom pesan secara manual.") });
    }
  }

  function applyPaste() {
    if (!snapshot) return;
    const result = parseKertasAcaraPaste(pasteText, snapshot.hymns);
    const summary = `${result.recognized} ${t("isian berhasil diisi. Periksa formulir, lalu Simpan.")}`;
    notify({ type: result.recognized ? result.warnings.length ? "info" : "success" : "error", key: "weekly-paste", message: [result.recognized ? summary : "", ...result.warnings.map(warning => t(warning))].filter(Boolean).join("\n") });
    setError("");
    setSuccess("");
    if (result.recognized > 0) {
      setValues(previous => previous ? { ...previous, ...result.values } : previous);
      setAppliedPaste(pasteText);
    }
  }

  const dirty = Boolean(values && snapshot && JSON.stringify(values) !== JSON.stringify(snapshot.values));
  const hasUnappliedPaste = Boolean(pasteText.trim() && pasteText !== appliedPaste);
  const hasUnsavedChanges = dirty || hasUnappliedPaste;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let baseline = Math.max(window.innerHeight, viewport.height);
    let frame = 0;
    const measure = () => {
      const active = document.activeElement;
      const editing = active instanceof HTMLElement && Boolean(formRef.current?.contains(active)) && active.matches("input:not([type=checkbox]):not([type=button]), textarea, [contenteditable=true]");
      if (!editing && viewport.scale === 1 && viewport.height >= window.innerHeight - 80) baseline = Math.max(window.innerHeight, viewport.height);
      setKeyboardOpen(editing && (viewport.scale > 1.05 || Math.max(baseline, window.innerHeight) - viewport.height > 140));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    viewport.addEventListener("resize", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule); window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule); document.removeEventListener("focusout", schedule);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/kertas-acara", { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login?next=/admin/kertas-acara"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (alive.current) { setSnapshot(data); setValues(data.values); setPasteText(""); setAppliedPaste(""); dismiss("weekly-paste"); dismiss("weekly-copy"); }
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : "Formulir belum dapat dimuat."); }
    finally { if (alive.current) setLoading(false); }
  }, [router]);

  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);

  useEffect(() => {
    if (!snapshot || saving) return;
    function advance() {
      if (document.hidden) return;
      setValues(previous => {
        if (!previous) return previous;
        const date = rollForwardSabbath(previous.date, snapshot!.dates);
        return date === previous.date ? previous : { ...previous, date };
      });
    }
    advance();
    const timer = window.setInterval(advance, 60_000);
    window.addEventListener("focus", advance);
    document.addEventListener("visibilitychange", advance);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", advance); document.removeEventListener("visibilitychange", advance); };
  }, [snapshot, saving]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  function change(key: keyof WeeklyValues, value: string) {
    setValues(previous => previous ? { ...previous, [key]: value } : previous); setSuccess("");
  }

  function clearFields() {
    if (saving || !snapshot?.canWrite) return;
    setValues(previous => previous ? {
      date: previous.date, sermonTitle: "", mainVerse: "", responsiveReading: "",
      openingHymn: "", closingHymn: "", ssOpeningHymn: "", ssClosingHymn: "",
    } : previous);
    setError(""); setSuccess("");
    setPasteText(""); setAppliedPaste(""); dismiss("weekly-paste"); dismiss("weekly-copy");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!snapshot || !values || saving || !snapshot.canWrite || !dirty) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/kertas-acara", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values, revision: snapshot.revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Sesi telah berakhir. Buka dashboard di tab baru untuk masuk kembali; isian di sini tetap tersedia." : data.error);
      setSnapshot(data); setValues(data.values);
      setSuccess(data.mode === "demo" ? "Latihan berhasil disimpan di komputer ini." : "Perubahan berhasil disimpan ke spreadsheet.");
    } catch (error) { setError(error instanceof Error ? error.message : "Gagal menyimpan. Isian Anda tetap tersedia."); }
    finally { setSaving(false); }
  }

  const dateLabel = (date: string) => language === "en"
    ? new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${date}T12:00:00+07:00`))
    : formatChurchDate(date);

  return <>
    <ConfirmDialog open={reloadConfirm} onClose={() => setReloadConfirm(false)} onConfirm={() => { setReloadConfirm(false); void load(); }} title="Refresh?" message="Muat ulang dan batalkan perubahan yang belum disimpan?" confirmLabel="Refresh" tone="primary" />
    <ConfirmDialog open={clearConfirm} onClose={() => setClearConfirm(false)} onConfirm={() => { setClearConfirm(false); clearFields(); }} title="Kosongkan formulir?" message="Hapus isian khotbah, lagu, dan teks tempelan? Tanggal Sabat tetap dipertahankan. Perubahan belum tersimpan sampai Anda memilih Simpan." confirmLabel="Kosongkan" />
    <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>{t("Kertas Acara")}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>{t("Perbarui detail khotbah dan lagu untuk ibadah Sabat.")}</Typography>
    {loading ? <Box role="status" sx={{ py: 5, display: "flex", gap: 2 }}><CircularProgress size={24} />{t("Memuat formulir…")}</Box> : values && snapshot ?
      <Box component="form" ref={formRef} onSubmit={save} className={`weekly-form${keyboardOpen ? " weekly-form--keyboard" : ""}`}>
        {!snapshot.canWrite && <StatusNote severity="warning" sx={{ mb: 3 }}>{t("Formulir dapat dilihat. Penyimpanan ke Google Sheets belum diaktifkan oleh pengelola.")}</StatusNote>}
        <section className="weekly-section" aria-label={t("Tanggal Sabat")}>
          <TextField select size="small" label={t("Tanggal Sabat")} value={values.date} onChange={event => change("date", event.target.value)} fullWidth disabled={saving || !snapshot.canWrite} helperText={t("Otomatis maju ke Sabat berikutnya mulai hari Minggu (WIB).")}>
            {snapshot.dates.map(date => <MenuItem key={date} value={date}>{dateLabel(date)}</MenuItem>)}
          </TextField>
        </section>
        <section className="weekly-section weekly-paste" aria-labelledby="weekly-paste-title">
          <div className="weekly-paste-heading">
            <Typography component="h2" variant="h6" id="weekly-paste-title">{t("Tempel dari WhatsApp")}</Typography>
            <GlassButton type="button" tone="plain" startIcon={<ContentCopy />} onClick={() => void copyTemplate()} disabled={saving || !snapshot.canWrite}>{t("Salin Format")}</GlassButton>
          </div>
          <TextField size="small" label={t("Pesan pembicara")} placeholder={PASTE_TEMPLATE} value={pasteText} onChange={event => { setPasteText(event.target.value); dismiss("weekly-paste"); }} fullWidth multiline minRows={5} maxRows={10} disabled={saving || !snapshot.canWrite} helperText={t("Terapkan untuk mengisi formulir. Periksa hasilnya sebelum Simpan.")} />
          <div className="weekly-paste-actions">
            <GlassButton type="button" tone="primary" onClick={applyPaste} disabled={saving || !snapshot.canWrite || !pasteText.trim()}>{t("Terapkan")}</GlassButton>
            <GlassButton type="button" tone="plain" onClick={() => { setPasteText(""); setAppliedPaste(""); dismiss("weekly-paste"); }} disabled={saving || !snapshot.canWrite || !pasteText}>{t("Bersihkan teks")}</GlassButton>
          </div>
        </section>
        <section className="weekly-section" aria-labelledby="weekly-sermon-title">
          <Typography component="h2" variant="h6" id="weekly-sermon-title" sx={{ mb: 2 }}>{t("Detail Khotbah")}</Typography>
          <div className="weekly-fields">
            <TextField size="small" label={t("Judul Khotbah")} value={values.sermonTitle} onChange={event => change("sermonTitle", event.target.value)} fullWidth disabled={saving || !snapshot.canWrite} slotProps={{ htmlInput: { maxLength: 2000 } }} />
            <TextField size="small" label={t("Ayat Inti")} placeholder={t("Contoh: Yohanes 3:16")} value={values.mainVerse} onChange={event => change("mainVerse", event.target.value)} fullWidth disabled={saving || !snapshot.canWrite} slotProps={{ htmlInput: { maxLength: 2000 } }} />
            <TextField size="small" label={t("Ayat Bersahutan")} value={values.responsiveReading} onChange={event => change("responsiveReading", event.target.value)} fullWidth multiline minRows={2} disabled={saving || !snapshot.canWrite} slotProps={{ htmlInput: { maxLength: 2000 } }} />
          </div>
        </section>
        {([
          { title: "Lagu Kebaktian", fields: ["openingHymn", "closingHymn"] },
          { title: "Lagu Sekolah Sabat", fields: ["ssOpeningHymn", "ssClosingHymn"] },
        ] as const).map((group, groupIndex) => <section className="weekly-section" key={group.title} aria-labelledby={`weekly-hymn-title-${groupIndex}`}>
          <Typography component="h2" variant="h6" id={`weekly-hymn-title-${groupIndex}`}>{t(group.title)}</Typography>
          <Typography color="text.secondary" variant="body2" id={`weekly-hymn-help-${groupIndex}`} sx={{ mt: .5, mb: 2.5 }}>{t("Cari nomor atau judul lagu")}</Typography>
          <div className="weekly-fields weekly-song-fields">
            {group.fields.map((key, index) => <Autocomplete key={key} size="small" options={snapshot.hymns} value={snapshot.hymns.find(hymn => hymn.number === values[key]) ?? (values[key] ? { number: values[key], title: t("Nomor dari spreadsheet") } : null)} getOptionLabel={hymn => `${hymn.number} — ${hymn.title}`} isOptionEqualToValue={(a, b) => a.number === b.number} onChange={(_, hymn) => change(key, hymn?.number ?? "")} disabled={saving || !snapshot.canWrite} noOptionsText={t("Lagu tidak ditemukan")} clearText={t("Kosongkan")} openText={t("Pilih lagu")} closeText={t("Tutup")} renderInput={params => <TextField {...params} size="small" label={t(index === 0 ? "Lagu Pembuka" : "Lagu Penutup")} slotProps={{ htmlInput: { ...params.inputProps, "aria-describedby": `weekly-hymn-help-${groupIndex}` } }} />} />)}
          </div>
        </section>)}
        <div className="weekly-feedback">


          <Typography variant="body2" color="text.secondary">{t(snapshot.mode === "demo" ? "Mode latihan: perubahan hanya disimpan secara lokal." : "Menyimpan langsung memperbarui Kertas Acara di website.")}</Typography>
        </div>
        <div className="weekly-actions" role="group" aria-label={t("Tindakan formulir")}>
          <GlassButton startIcon={<SaveOutlined />} type="submit" tone="primary" className="weekly-save" disabled={!dirty || saving || !snapshot.canWrite}>{t(saving ? "Menyimpan…" : "Simpan")}</GlassButton>
          <GlassButton startIcon={<Refresh />} type="button" disabled={saving} onClick={() => { if (hasUnsavedChanges) setReloadConfirm(true); else void load(); }}>{t("Refresh")}</GlassButton>
          <GlassButton type="button" tone="plain" aria-haspopup="menu" aria-expanded={menuAnchor ? true : undefined} aria-controls={menuAnchor ? "weekly-more-menu" : undefined} id="weekly-more-button" onClick={event => setMenuAnchor(event.currentTarget)} disabled={saving}>{t("Lainnya")}</GlassButton>
        </div>
        <Menu id="weekly-more-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} slotProps={{ list: { "aria-labelledby": "weekly-more-button" } }}>
          <MenuItem disabled={saving || !snapshot.canWrite} onClick={() => { setMenuAnchor(null); setClearConfirm(true); }} sx={{ minHeight: 48, gap: 1.5, color: "error.main" }}><Close fontSize="small" />{t("Kosongkan formulir")}</MenuItem>
          {snapshot.mode === "google" && <MenuItem component={Link} href="/kertas-acara" target="_blank" rel="noopener noreferrer" onClick={() => setMenuAnchor(null)} sx={{ minHeight: 48, gap: 1.5 }}><OpenInNew fontSize="small" />{t("Lihat Kertas Acara")}</MenuItem>}
        </Menu>
      </Box> : <>

        <Button variant="outlined" onClick={() => void load()}>{t("Coba Lagi")}</Button>
      </>}
  </>;
}
