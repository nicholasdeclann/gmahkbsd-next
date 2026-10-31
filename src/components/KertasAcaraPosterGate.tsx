"use client";
import { useEffect, useState, Fragment, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, nextSabbath, type AnnouncementItem } from "@/lib/announcementTypes";
import { useLanguage } from "./LanguageProvider";
import { GlassButton } from "./ui/glass/GlassControls";
import { ChevronLeft, ChevronRight } from "./ui/icons";
import SabbathPoster from "./SabbathPoster";
import KertasAcaraLoading from "@/app/kertas-acara/loading";

export default function KertasAcaraPosterGate({ children }: { children: ReactNode }) {
  const { t, language } = useLanguage(), params = useSearchParams();
  const next = params.get("week") === "next";
  const [tick, setTick] = useState(0), [attempt, setAttempt] = useState(0);
  const date = addDays(nextSabbath(), next ? 7 : 0);
  const [result, setResult] = useState<{ date: string; poster: AnnouncementItem | null } | null>(null), [error, setError] = useState(false);
  useEffect(() => {
    const update = () => { if (!document.hidden) setTick(value => value + 1); };
    const timer = setInterval(update, 60000);
    window.addEventListener("focus", update); document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setError(false);
    fetch("/api/sabbath-poster?date=" + date, { cache: "no-store", signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(value => { if (!controller.signal.aborted) setResult(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [date, attempt, tick]);
  if (error) return <div className="site-width page-intro"><h1>{t("Kertas Acara")}</h1><p>{t("Penetapan poster belum dapat dimuat. Silakan coba lagi.")}</p><GlassButton onClick={() => setAttempt(value => value + 1)}>{t("Coba Lagi")}</GlassButton></div>;
  if (result?.date !== date) return <KertasAcaraLoading />;
  if (!result.poster) return <Fragment key={date}>{children}</Fragment>;
  return <div className="site-width page-intro"><h1>{t("Kertas Acara")}</h1>
    <nav className="poster-date-navigation" aria-label={t("Tanggal Sabat")}>
      <time dateTime={date}>{new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(date + "T12:00:00+07:00"))}</time>
      <GlassButton href={next ? "/kertas-acara" : "/kertas-acara?week=next"} startIcon={next ? <ChevronLeft /> : undefined} endIcon={!next ? <ChevronRight /> : undefined}>{t(next ? "Sabat Ini" : "Sabat Depan")}</GlassButton>
    </nav><SabbathPoster key={result.poster.id} post={result.poster} />
  </div>;
}
