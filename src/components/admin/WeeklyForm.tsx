"use client";
import { GlassButton } from "../ui/glass/GlassControls";
import ConfirmDialog from "../ui/glass/ConfirmDialog";
import { SaveOutlined, Refresh, OpenInNew, ContentCopy } from "../ui/icons";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Close from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import { Alert, Autocomplete, Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import { formatChurchDate, rollForwardSabbath, type WeeklySnapshot, type WeeklyValues } from "@/lib/kertasAcaraForm";
import { parseKertasAcaraPaste, type PasteResult } from "@/lib/kertasAcaraPaste";

const PASTE_TEMPLATE = `Judul Khotbah : 
Ayat Inti : 
Ayat Bersahutan : 
Lagu Buka : 
Lagu Tutup : `;

export default function WeeklyForm() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<WeeklySnapshot | null>(null);
  const [values, setValues] = useState<WeeklyValues | null>(null);
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const alive = useRef(true);
  const [pasteText, setPasteText] = useState("");
  const [pasteResult, setPasteResult] = useState<PasteResult | null>(null);

  function copyTemplate() {
    navigator.clipboard.writeText(PASTE_TEMPLATE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function applyPaste() {
    if (!snapshot) return;
    const result = parseKertasAcaraPaste(pasteText, snapshot.hymns);
    setPasteResult(result);
    setError("");
    setSuccess("");
    if (result.recognized > 0) {
      setValues(previous => previous ? { ...previous, ...result.values } : previous);
    }
  }

  const dirty = Boolean(values && snapshot && JSON.stringify(values) !== JSON.stringify(snapshot.values));

  const load = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/kertas-acara", { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login?next=/admin/kertas-acara"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (alive.current) { setSnapshot(data); setValues(data.values); }
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
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!snapshot || !values || saving) return;
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

  return (
    <>
      <ConfirmDialog
        open={reloadConfirm}
        onClose={() => setReloadConfirm(false)}
        onConfirm={() => { setReloadConfirm(false); void load(); }}
        title="Refresh?"
        message="Muat ulang dan batalkan perubahan yang belum disimpan?"
        confirmLabel="Refresh"
        tone="primary"
      />
      <Typography component="h1" variant="h4" sx={{ fontWeight: 350, mb: 1 }}>Kertas Acara</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>Perbarui detail khotbah dan lagu untuk ibadah Sabat.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" role="status" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box role="status" sx={{ py: 5, display: "flex", gap: 2 }}><CircularProgress size={24} /> Memuat formulir…</Box>
      ) : values && snapshot ? (
        <Box component="form" onSubmit={save}>
          {!snapshot.canWrite && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>Formulir dapat dilihat. Penyimpanan ke Google Sheets belum diaktifkan oleh pengelola.</Alert>
          )}

          {/* Quick Paste Box */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              borderRadius: "16px",
              background: "var(--site-soft, rgba(0,0,0,0.03))",
              border: "1px solid var(--site-border)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600, color: "var(--site-text)" }}>
                Tempel Format Pembicara
              </Typography>
              <GlassButton
                tone="glass"
                size="small"
                startIcon={<ContentCopy />}
                onClick={copyTemplate}
              >
                {copied ? "Tersalin!" : "Salin Format WA"}
              </GlassButton>
            </Box>

            <TextField
              size="small"
              placeholder={PASTE_TEMPLATE}
              value={pasteText}
              onChange={event => setPasteText(event.target.value)}
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              disabled={saving || !snapshot.canWrite}
              helperText="Tempel teks pesan pembicara di sini lalu tekan Terapkan untuk mengisi form di bawah."
              sx={{
                "& .MuiInputBase-root": { fontSize: "0.875rem" }
              }}
            />

            <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }}>
              <GlassButton
                tone="primary"
                size="small"
                onClick={applyPaste}
                disabled={saving || !snapshot.canWrite || !pasteText.trim()}
              >
                Terapkan ke Form
              </GlassButton>
              <GlassButton
                tone="plain"
                size="small"
                onClick={() => { setPasteText(""); setPasteResult(null); }}
                disabled={!pasteText && !pasteResult}
              >
                Bersihkan
              </GlassButton>
            </Box>

            {pasteResult && pasteResult.recognized > 0 && (
              <Alert severity="success" role="status" sx={{ mt: 1.5, py: 0.5 }}>
                {pasteResult.recognized} isian berhasil terisi otomatis. Periksa di bawah, lalu tekan Simpan.
              </Alert>
            )}
            {pasteResult && pasteResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                {pasteResult.warnings.map(warning => <div key={warning}>{warning}</div>)}
              </Alert>
            )}
          </Box>

          <Box sx={{ pt: 1, mb: 3 }}>
            <TextField
              select
              size="small"
              label="Tanggal Sabat"
              value={values.date}
              onChange={event => change("date", event.target.value)}
              fullWidth
              disabled={saving || !snapshot.canWrite}
              helperText="Otomatis maju ke Sabat berikutnya mulai hari Minggu (WIB)."
            >
              {snapshot.dates.map(date => <MenuItem key={date} value={date}>{formatChurchDate(date)}</MenuItem>)}
            </TextField>

            <Typography component="h2" variant="subtitle1" sx={{ mt: 3, mb: 1.5, fontWeight: 600 }}>
              Detail Khotbah
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField
                size="small"
                label="Judul Khotbah"
                value={values.sermonTitle}
                onChange={event => change("sermonTitle", event.target.value)}
                fullWidth
                disabled={saving || !snapshot.canWrite}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              <TextField
                size="small"
                label="Ayat Inti"
                placeholder="Contoh: Yohanes 3:16"
                value={values.mainVerse}
                onChange={event => change("mainVerse", event.target.value)}
                fullWidth
                disabled={saving || !snapshot.canWrite}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              <TextField
                size="small"
                label="Ayat Bersahutan"
                value={values.responsiveReading}
                onChange={event => change("responsiveReading", event.target.value)}
                fullWidth
                multiline
                minRows={2}
                disabled={saving || !snapshot.canWrite}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
            </Box>

            {([
              { title: "Lagu Kebaktian", fields: ["openingHymn", "closingHymn"] },
              { title: "Lagu Sekolah Sabat", fields: ["ssOpeningHymn", "ssClosingHymn"] }
            ] as const).map(group => (
              <Box key={group.title} sx={{ mt: 2.5 }}>
                <Typography component="h2" variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>{group.title}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  {group.fields.map((key, index) => (
                    <Autocomplete
                      key={key}
                      size="small"
                      options={snapshot.hymns}
                      value={snapshot.hymns.find(hymn => hymn.number === values[key]) ?? (values[key] ? { number: values[key], title: "Nomor dari spreadsheet" } : null)}
                      getOptionLabel={hymn => `${hymn.number} — ${hymn.title}`}
                      isOptionEqualToValue={(a, b) => a.number === b.number}
                      onChange={(_, hymn) => change(key, hymn?.number ?? "")}
                      disabled={saving || !snapshot.canWrite}
                      noOptionsText="Lagu tidak ditemukan"
                      clearText="Kosongkan"
                      openText="Pilih lagu"
                      closeText="Tutup"
                      renderInput={params => (
                        <TextField
                          {...params}
                          size="small"
                          label={index === 0 ? "Lagu Pembuka" : "Lagu Penutup"}
                          helperText="Cari nomor atau judul lagu"
                        />
                      )}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {snapshot.mode === "demo" ? "Mode latihan: perubahan hanya disimpan secara lokal." : "Menyimpan akan langsung memperbarui Kertas Acara yang digunakan website."}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <GlassButton startIcon={<SaveOutlined />} type="submit" tone="primary" disabled={!dirty || saving || !snapshot.canWrite}>
              {saving ? "Menyimpan…" : "Simpan"}
            </GlassButton>
            <GlassButton tone="danger-quiet" startIcon={<Close />} onClick={clearFields} disabled={saving || !snapshot.canWrite}>
              Kosongkan
            </GlassButton>
            <GlassButton startIcon={<Refresh />} disabled={saving} onClick={() => { if(dirty) setReloadConfirm(true); else void load(); }}>
              Refresh
            </GlassButton>
            {snapshot.mode === "google" && (
              <GlassButton tone="plain" endIcon={<OpenInNew />} component={Link} href="/kertas-acara" target="_blank">
                Lihat Kertas Acara
              </GlassButton>
            )}
          </Box>
        </Box>
      ) : (
        <Button variant="outlined" onClick={() => void load()}>Coba Lagi</Button>
      )}
    </>
  );
}
