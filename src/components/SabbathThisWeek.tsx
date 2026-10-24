"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowForward } from "@/components/ui/icons";
import ShaderGradientBg from "@/components/ui/ShaderGradientBg";
import { useLanguage } from "./LanguageProvider";
import { churchConfig } from "@/config/church";
import type { SabbathSummary } from "@/lib/sabbathSummary";

export default function SabbathThisWeek() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<SabbathSummary | null>(null);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let request = 0;
    async function load() {
      const generation = ++request;
      try {
        const response = await fetch("/api/sabat-ini", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const value = await response.json();
        if (!controller.signal.aborted && generation === request) {
          setData(value);
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted && generation === request) setError(true);
      }
    }
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 300000);
    function visible() {
      if (!document.hidden) void load();
    }
    document.addEventListener("visibilitychange", visible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  return (
    <ShaderGradientBg variant="sabbath" className="sabbath-band">
      <section className="site-width sabbath-summary" aria-labelledby="sabbath-title">
        <div className="sabbath-summary-heading">
          <h2 id="sabbath-title" className="section-title">
            {t("Sabat Ini")}
          </h2>
          {data && (
            <p className="sabbath-date">
              <time dateTime={data.date}>
                {new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Jakarta",
                }).format(new Date(`${data.date}T12:00:00+07:00`))}
              </time>
              <br />
              {churchConfig.services[0].time}
            </p>
          )}
          <Link className="text-link sabbath-link" href="/kertas-acara">
            {t("Lihat Kertas Acara")} <ArrowForward fontSize="small" />
          </Link>
        </div>
        <div className="sabbath-summary-details" aria-live="polite" aria-busy={!data && !error}>
          {error ? (
            <p>
              {t("Informasi Sabat belum dapat dimuat.")}{" "}
              <button
                type="button"
                className="sabbath-retry"
                onClick={() => setRefresh((value) => value + 1)}
              >
                {t("Coba Lagi")}
              </button>
            </p>
          ) : !data ? (
            <p>{t("Memuat informasi Sabat…")}</p>
          ) : (
            <>
              <p className="sabbath-meta-label">{t("Judul Khotbah")}</p>
              <h3>{data.title || t("Informasi khotbah segera tersedia.")}</h3>
              <dl>
                <div>
                  <dt>{t("Pembicara")}</dt>
                  <dd>{data.speaker || t("Segera diumumkan")}</dd>
                </div>
                <div>
                  <dt>{t("Ayat Inti")}</dt>
                  <dd>{data.verse || t("Segera diumumkan")}</dd>
                </div>
              </dl>
              {data.stale && (
                <p className="sabbath-status">
                  {t("Menampilkan informasi terakhir yang berhasil dimuat.")}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </ShaderGradientBg>
  );
}
