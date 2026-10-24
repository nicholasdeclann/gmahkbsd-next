"use client";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import ShaderGradientBg from "@/components/ui/ShaderGradientBg";
import { T, useLanguage } from "@/components/LanguageProvider";
import { fetchTextCached, CACHE_TTL } from "@/lib/sheetCache";
import {
  type BirthdayPerson,
  SHEET_URLS,
  getCurrentWeekRange,
  parseBirthdayRow,
  isBirthdayThisWeek,
  getDayName,
} from "./utils";

export default function UlangTahunPage() {
  const { language } = useLanguage();
  const locale = language === "en" ? "en-GB" : "id-ID";

  const dateLabel = (date: Date, short = false) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: short ? "short" : "long",
      ...(short ? {} : { year: "numeric" as const }),
      timeZone: "Asia/Jakarta",
    }).format(date);

  const monthShortLabel = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      timeZone: "Asia/Jakarta",
    }).format(date);

  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weekRange, setWeekRange] = useState<{
    sunday: Date;
    saturday: Date;
  } | null>(null);

  useEffect(() => {
    const range = getCurrentWeekRange();
    setWeekRange(range);

    Promise.all(
      SHEET_URLS.map((url) =>
        fetchTextCached(url, CACHE_TTL.birthdays)
          .then((text) => {
            const json = JSON.parse(text.substring(47, text.length - 2));
            return (json.table?.rows ?? []) as {
              c?: ({ v?: unknown } | null)[];
            }[];
          })
          .catch(() => null),
      ),
    )
      .then((tabRows) => {
        if (tabRows.every((rows) => rows === null)) {
          throw new Error("Birthday sheets unavailable");
        }
        const seen = new Set<string>();
        const birthdayList: BirthdayPerson[] = [];

        for (const rows of tabRows) {
          if (!rows) continue;
          for (const row of rows) {
            if (!row.c) continue;

            const parsed = parseBirthdayRow(row.c);
            if (!parsed) continue;

            const key = `${parsed.nama.toLowerCase()}|${parsed.birthday.month}|${parsed.birthday.day}`;
            if (seen.has(key)) continue;

            if (isBirthdayThisWeek(parsed.birthday, range)) {
              seen.add(key);
              const birthdayDate = new Date(
                new Date().getFullYear(),
                parsed.birthday.month,
                parsed.birthday.day,
              );

              birthdayList.push({
                nama: parsed.nama,
                birthday: parsed.birthday,
                birthdayDate,
                dayName: getDayName(birthdayDate),
              });
            }
          }
        }

        birthdayList.sort(
          (a, b) => a.birthdayDate.getTime() - b.birthdayDate.getTime(),
        );

        setBirthdays(birthdayList);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="birthday-page">
      <ShaderGradientBg variant="birthday" className="birthday-shader-hero">
        <div className="site-width birthday-hero-inner">
          <p className="hero-church-name">GMAHK BUMI SERPONG DAMAI</p>
          <h1 className="birthday-hero-title">
            <T text="Ulang Tahun Minggu Ini" />
          </h1>
          <p className="birthday-hero-subtitle">
            <T text="Sampaikan ucapan dan doa untuk keluarga jemaat kita." />
          </p>
          {weekRange && (
            <p className="birthday-hero-meta">
              <span>
                {dateLabel(weekRange.sunday)} – {dateLabel(weekRange.saturday)}
              </span>
              {!loading && !error && (
                <>
                  {" · "}
                  <strong>{birthdays.length}</strong>{" "}
                  <T text="jemaat berulang tahun minggu ini" />
                </>
              )}
            </p>
          )}
        </div>
      </ShaderGradientBg>

      <div className="site-width section-space">
        {loading ? (
          <div className="birthday-loading" role="status" aria-live="polite">
            <CircularProgress size={40} sx={{ color: "var(--site-blue)" }} />
            <p>
              <T text="Memuat…" />
            </p>
          </div>
        ) : error ? (
          <div className="birthday-empty-open" role="alert">
            <h2>
              <T text="Gagal memuat data ulang tahun." />
            </h2>
            <p>
              <T text="Silakan muat ulang halaman ini beberapa saat lagi." />
            </p>
          </div>
        ) : birthdays.length === 0 ? (
          <div className="birthday-empty-open">
            <h2>
              <T text="Tidak ada ulang tahun minggu ini." />
            </h2>
            <p>
              <T text="Daftar ini diperbarui secara otomatis setiap awal pekan." />
            </p>
          </div>
        ) : (
          <div className="birthday-open-grid">
            {birthdays.map((person) => (
              <article
                className="birthday-open-item"
                key={`${person.nama}-${person.birthday.month}-${person.birthday.day}`}
              >
                <div className="birthday-open-date" aria-hidden="true">
                  <span className="birthday-open-day">{person.birthday.day}</span>
                  <span className="birthday-open-month">
                    {monthShortLabel(person.birthdayDate)}
                  </span>
                </div>
                <div className="birthday-open-info">
                  <h2>{person.nama}</h2>
                  <p>
                    <T text={person.dayName} />, {dateLabel(person.birthdayDate, true)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
