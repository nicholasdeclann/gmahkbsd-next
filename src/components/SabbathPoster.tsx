"use client";
import { useState } from "react";
import Link from "next/link";
import type { AnnouncementItem } from "@/lib/announcementTypes";
import { useLanguage } from "./LanguageProvider";
import { useNotifications } from "./ui/notifications/NotificationProvider";
import { GlassButton } from "./ui/glass/GlassControls";
import Lightbox from "./ui/glass/Lightbox";
import { Download, OpenInNew } from "./ui/icons";
import "./sabbath-poster.css";

export default function SabbathPoster({ post, compact = false }: { post: AnnouncementItem; compact?: boolean }) {
  const { t } = useLanguage();
  const Heading = compact ? "h3" : "h2";
  const { notify } = useNotifications();
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false);
  async function download() {
    if (busy) return; setBusy(true);
    try {
      const response = await fetch(post.image_url, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const blob = await response.blob(), url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `${post.title.replace(/[<>:"/\\|?*]/g, "-")}.${blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg"}`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { notify({ type: "error", key: "poster-download", message: t("Poster belum berhasil diunduh. Silakan coba lagi.") }); }
    finally { setBusy(false); }
  }
  const picture = (failed ? <div className="sabbath-poster-failed"><p>{t("Gambar belum dapat dimuat.")}</p><GlassButton onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>{t("Coba Lagi")}</GlassButton></div> :
      <button className="sabbath-poster-image" onClick={() => setOpen(true)} aria-label={t("Perbesar") + ": " + post.title}>
        {/* The original poster remains uncropped and readable in the zoomable lightbox. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={attempt} src={post.image_url} alt={post.title} onError={() => setFailed(true)} />
      </button>);
  const copy = <div className="sabbath-poster-copy"><span className="sabbath-poster-label">{t("Acara Khusus")}</span><Heading>{post.title}</Heading><p>{t("Lihat jadwal lengkap pada poster.")}</p></div>;
  const lightbox = <Lightbox open={open} onClose={() => setOpen(false)} src={post.image_url} title={post.title} caption={post.caption} zoomable />;
  if (compact) return <section className="sabbath-poster sabbath-poster--compact" aria-label={t("Acara Khusus")}>
    {picture}<div className="sabbath-poster-preview-copy">{copy}<div className="sabbath-poster-actions"><GlassButton tone="primary" href="/kertas-acara">{t("Lihat Jadwal")}</GlassButton></div></div>{lightbox}
  </section>;
  return <section className="sabbath-poster" aria-label={t("Acara Khusus")}>
    {copy}{picture}
    <div className="sabbath-poster-actions">
      <GlassButton tone="glass" startIcon={<OpenInNew />} onClick={() => setOpen(true)} disabled={failed}>{t("Perbesar")}</GlassButton>
      <GlassButton tone="primary" startIcon={<Download />} onClick={() => void download()} disabled={busy}>{t(busy ? "Mengunduh…" : "Unduh Poster")}</GlassButton>
      <Link className="text-link" href="/jadwal-pelayanan">{t("Jadwal Pelayanan Triwulan")}</Link>
    </div>
    {post.caption && <p className="sabbath-poster-caption">{post.caption}</p>}{lightbox}
  </section>;
}
