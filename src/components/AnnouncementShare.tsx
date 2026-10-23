"use client";
import { T, useLanguage } from "@/components/LanguageProvider";

import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { ShareOutlined, ContentCopy, OpenInNew } from "./ui/icons";

export default function AnnouncementShare({ id, caption, board = false }: { id?: string; caption?: string | null; board?: boolean }) {
  const {t}=useLanguage();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  function open() {
    const link = new URL("/pengumuman", window.location.origin);
    if (id) { link.searchParams.set("post", id); link.hash = "pengumuman-" + id; }
    setUrl(link.toString()); setCopied(false); setError("");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setError(""); }
    catch { setError("Salin tautan dari kotak di bawah, lalu kirim ke jemaat."); }
  }
  const text = (caption?.slice(0, 160) || "Pengumuman GMAHK BSD") + "\n" + url;
  return <>
    <Button startIcon={<ShareOutlined />} variant={board ? "outlined" : "text"} onClick={open}>{t(board ? "Bagikan Papan Pengumuman" : "Bagikan")}</Button>
    <Dialog open={Boolean(url)} onClose={() => setUrl("")} maxWidth="sm" fullWidth aria-labelledby="share-announcement-title">
      <DialogTitle id="share-announcement-title"><T text="Bagikan kepada Jemaat" /></DialogTitle>
      <DialogContent>
        {copied && <Alert severity="success" sx={{ mb: 2 }}><T text="Tautan tersalin. Siap dikirim ke jemaat." /></Alert>}
        {error && <Alert severity="info" sx={{ mb: 2 }}>{t(error)}</Alert>}
        <TextField fullWidth label={t("Tautan pengumuman")} value={url} slotProps={{ input: { readOnly: true } }} sx={{ mt: 1 }} onFocus={event => event.target.select()} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={() => setUrl("")}><T text="Tutup" /></Button>
        <Button endIcon={<OpenInNew />} component="a" href={"https://wa.me/?text=" + encodeURIComponent(text)} target="_blank" rel="noopener noreferrer">WhatsApp</Button>
        <Button startIcon={<ContentCopy />} variant="contained" onClick={() => void copy()}><T text="Salin Tautan" /></Button>
      </DialogActions>
    </Dialog>
  </>;
}
