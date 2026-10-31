"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { CircularProgress } from "@mui/material";
import ShaderGradientBg from "@/components/ui/ShaderGradientBg";
import { T, useLanguage } from "@/components/LanguageProvider";
import { CakeOutlined, GiftOutlined, PartyPopperOutlined } from "@/components/ui/icons";
import { fetchTextCached, CACHE_TTL } from "@/lib/sheetCache";
import { useNotifications } from "@/components/ui/notifications/NotificationProvider";
import {
  type BirthdayPerson,
  SHEET_URLS,
  getCurrentWeekRange,
  parseBirthdayRow,
  isBirthdayThisWeek,
  getDayName,
} from "./utils";

const birthdayIcons = [CakeOutlined, GiftOutlined, PartyPopperOutlined];
function birthdayStyle(name: string) {
  const hash = Array.from(name.toLowerCase()).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
  return { Icon: birthdayIcons[hash % birthdayIcons.length] };
}

export default function UlangTahunPage() {
  const { notify } = useNotifications();
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
  const [birthdayHues, setBirthdayHues] = useState<number[]>([]);
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

        // Shuffle evenly spaced hues once per load: distinct cards without render-time flicker.
        const startHue = Math.random() * 360;
        const hues = birthdayList.map((_, index) => (startHue + index * 360 / birthdayList.length) % 360);
        for (let i = hues.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [hues[i], hues[j]] = [hues[j], hues[i]];
        }
        setBirthdayHues(hues);
        setBirthdays(birthdayList);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        notify({type:"error",key:"birthday-load",message:"Gagal memuat data ulang tahun."});
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="birthday-page">
      <ShaderGradientBg variant="birthday" className="birthday-shader-hero">
        <div className="site-width birthday-hero-inner">
          <div className="birthday-celebration-icons" aria-hidden="true"><GiftOutlined/><CakeOutlined/><PartyPopperOutlined/></div>
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
          <div className="birthday-empty-open"><button className="glass-btn glass-btn--glass" onClick={()=>location.reload()}><T text="Coba Lagi"/></button></div>
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
            {birthdays.map((person, index) => { const { Icon } = birthdayStyle(person.nama); return (
              <article
                className="birthday-open-item"
                data-accent="birthday"
                style={{ "--birthday-hue": birthdayHues[index] ?? 0 } as CSSProperties}
                key={`${person.nama}-${person.birthday.month}-${person.birthday.day}`}
              >
                <time className="birthday-open-date" dateTime={`${person.birthdayDate.getFullYear()}-${String(person.birthday.month + 1).padStart(2, "0")}-${String(person.birthday.day).padStart(2, "0")}`}>
                  <span className="birthday-open-day">{person.birthday.day}</span>
                  <span className="birthday-open-month">
                    {monthShortLabel(person.birthdayDate)}
                  </span>
                </time>
                <div className="birthday-open-info">
                  <h2>{person.nama}</h2>
                  <p>
                    <T text={person.dayName} />
                  </p>
                </div>
                <span className="birthday-person-icon" aria-hidden="true"><Icon/></span>
              </article>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
