"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import { Refresh } from "@/components/ui/icons";
import { TodayOutlined } from "@/components/ui/icons";
import { useLanguage } from "./LanguageProvider";
import type { QuarterlySchedule } from "@/lib/quarterlySchedule";

export default function QuarterlyScheduleTable() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<QuarterlySchedule | null>(null);
  const [busy, setBusy] = useState(true), [error, setError] = useState(false), [query, setQuery] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const load = useCallback(async (signal: AbortSignal, force = false) => {
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/jadwal-pelayanan${force ? "?refresh=1" : ""}`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      const result: QuarterlySchedule = await response.json();
      if (!signal.aborted) setData(result);
    } catch { if (!signal.aborted) setError(true); }
    finally { if (!signal.aborted) setBusy(false); }
  }, []);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal, refresh > 0);
    const timer = window.setInterval(() => { if (!document.hidden) void load(controller.signal); }, 300000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load, refresh]);
  const locale = language === "en" ? "en-GB" : "id-ID";
  const dateLabel = (date: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${date}T12:00:00+07:00`));
  const nearest = data?.dates.find(date => date >= data.today);
  const needle = query.trim().toLocaleLowerCase();
  const matches = (value: string) => Boolean(needle && value.toLocaleLowerCase().includes(needle));
  const count = data?.rows.filter(row => !row.heading).reduce((sum, row) => sum + row.values.filter(matches).length, 0) ?? 0;
  function jump() {
    const target = scroller.current?.querySelector<HTMLElement>(`[data-date="${nearest}"]`);
    const role = scroller.current?.querySelector<HTMLElement>(".quarter-role");
    if (target && scroller.current) {
      scroller.current.scrollTo({ left: target.offsetLeft - (role?.offsetWidth ?? 0), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }
  return <section className="site-width section-space quarterly-page">
    <p className="eyebrow">{t("IBADAH & PELAYANAN")}</p>
    <h1 className="section-title">{t("Jadwal Pelayanan")}</h1>
    <p className="section-description">{t("Jadwal pelayanan jemaat untuk seluruh Sabat dalam triwulan ini.")}</p>
    <Link href="/kertas-acara" className="text-link">{t("Kertas Acara")} →</Link>
    {data && <h2 className="quarter-period">{t("Triwulan")} {data.quarter} · {new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(data.year, (data.quarter - 1) * 3, 1))}–{new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(data.year, data.quarter * 3 - 1, 1))} {data.year}</h2>}
    <div className="quarter-toolbar">
      <TextField label={t("Cari nama pelayan")} value={query} onChange={event => setQuery(event.target.value)} type="search" size="small" />
      <Button variant="outlined" startIcon={<TodayOutlined />} disabled={!nearest} onClick={jump}>{t("Ke Sabat Terdekat")}</Button>
      <Button startIcon={<Refresh />} disabled={busy} onClick={() => setRefresh(value => value + 1)}>{t("Perbarui")}</Button>
    </div>
    <p className="quarter-help">{t("Geser tabel ke samping untuk melihat tanggal lainnya. Kolom tugas tetap terlihat.")}</p>
    {needle && <p role="status">{count ? `${count} ${t("penugasan ditemukan.")}` : t("Tidak ada nama yang cocok.")}</p>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{t("Jadwal belum dapat dimuat. Silakan coba lagi.")}</Alert>}
    {data?.stale && <Alert severity="info" sx={{ mb: 2 }}>{t("Google Sheets sedang lambat. Menampilkan jadwal terakhir yang berhasil dimuat.")}</Alert>}
    {busy && !data && <div className="quarter-loading"><CircularProgress aria-label={t("Memuat jadwal…")} /></div>}
    {data && !data.dates.length && <Alert severity="info">{t("Jadwal belum tersedia untuk triwulan ini.")}</Alert>}
    {data && data.dates.length > 0 && <>
      {data.missingDates.length > 0 && <Alert severity="info" sx={{ mb: 2 }}>{t("Jadwal belum lengkap. Tanggal berikut belum tersedia:")} {data.missingDates.map(dateLabel).join(", ")}.</Alert>}
      <div className="quarter-scroll" ref={scroller} role="region" aria-label={t("Tabel jadwal pelayanan triwulan")} tabIndex={0} aria-busy={busy}>
        <table className="quarter-table">
          <caption>{t("Jadwal Pelayanan")} · {data.year} · {t("Triwulan")} {data.quarter}</caption>
          <thead><tr><th scope="col" className="quarter-role">{t("Tugas Pelayanan")}</th>{data.dates.map(date => <th scope="col" key={date} data-date={date} className={date === nearest ? "quarter-nearest" : undefined}><time dateTime={date}>{dateLabel(date)}</time>{date === nearest && <small>{t("Sabat terdekat")}</small>}</th>)}</tr></thead>
          <tbody>{data.rows.map(row => row.heading
            ? <tr className="quarter-section" key={row.id}><th scope="row" className="quarter-role">{t(row.label)}</th><td colSpan={data.dates.length} /></tr>
            : <tr key={row.id}><th scope="row" className="quarter-role">{t(row.label)}</th>{row.values.map((value, index) => <td key={data.dates[index]} className={data.dates[index] === nearest ? "quarter-nearest" : undefined}>{matches(value) ? <mark>{value}</mark> : value || <span aria-label={t("Belum diisi")}>—</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </>}
  </section>;
}

