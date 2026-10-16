"use client";
import { T, useLanguage } from "@/components/LanguageProvider";


import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Fade,
} from "@mui/material";
import { useState, useEffect } from "react";
import Image from "next/image";
import SentimentDissatisfied from "@mui/icons-material/SentimentDissatisfied";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import { fetchTextCached, CACHE_TTL } from "@/lib/sheetCache";
import {
  type BirthdayPerson,
  SHEET_URLS,
  getCurrentWeekRange,


  parseBirthdayRow,
  isBirthdayThisWeek,
  getDayName,
} from "./utils";

function UlangTahunPage() {
  const {language}=useLanguage();
  const dateLabel=(date:Date,short=false)=>new Intl.DateTimeFormat(language==="en"?"en-GB":"id-ID",{day:"numeric",month:short?"short":"long",...(short?{}:{year:"numeric" as const}),timeZone:"Asia/Jakarta"}).format(date);
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

    // Fetch every birthday tab in parallel and merge the results.
    Promise.all(
      SHEET_URLS.map((url) =>
        fetchTextCached(url, CACHE_TTL.birthdays)
          .then((text) => {
            const json = JSON.parse(text.substring(47, text.length - 2));
            return (json.table?.rows ?? []) as {
              c?: ({ v?: unknown } | null)[];
            }[];
          })
          // Ignore a single failing/empty tab rather than failing the page.
          .catch(() => null),
      ),
    )
      .then((tabRows) => {
        if (tabRows.every(rows => rows === null)) throw new Error("Birthday sheets unavailable");
        const seen = new Set<string>();
        const birthdayList: BirthdayPerson[] = [];

        for (const rows of tabRows) {
          if (!rows) continue;
          for (const row of rows) {
            if (!row.c) continue;

            const parsed = parseBirthdayRow(row.c);
            if (!parsed) continue;

            // Deduplicate people that appear across multiple tabs.
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

        // Sort by date
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
    <Box sx={styles.mainContainer}>
      {loading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={60} sx={{ color: "var(--site-blue)" }} />
        </Box>
      ) : (
        <Fade in={!loading} timeout={0}>
          <Box sx={{ width: "100%" }}>
            {/* Festive Background Effects */}
            <Box sx={styles.festiveBackground1} />
            <Box sx={styles.festiveBackground2} />
            <Box sx={styles.festiveBackground3} />
            <Box sx={styles.festiveBackground4} />

            {/* Full-width Header Image */}
            <Box sx={styles.headerImageContainer}>
              <Image
                src={imageAsset(churchConfig.assets.birthdayHeader)}
                alt="Birthday Balloons"
                width={1200}
                height={200}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
                priority
              />
              {/* Gradient Fade Overlay */}
              <Box sx={styles.gradientOverlay} />
            </Box>

            <Container maxWidth="lg" sx={styles.contentContainer}>
              <Box sx={styles.headerSection}>
                <Typography component="h1" variant="h3" sx={styles.title}><T text="Ulang Tahun" /></Typography>
                {weekRange && (
                  <>
                    <Typography component="p" variant="h6" sx={styles.countText}>
                      {error ? (
                        <T text="Gagal memuat data" />
                      ) : birthdays.length === 0 ? (
                        <T text="Tidak ada yang berulang tahun minggu ini..." />
                      ) : (
                        <>
                          {birthdays.length} <T text="jemaat berulang tahun minggu ini!" />
                          🎉
                        </>
                      )}
                    </Typography>
                    <Typography variant="body1" sx={styles.weekRangeText}>
                      {dateLabel(weekRange.sunday)} -{" "}
                      {dateLabel(weekRange.saturday)}
                    </Typography>
                  </>
                )}
              </Box>

              {error && (
                <Box sx={styles.centerBox}>
                  <ErrorOutline sx={styles.icon} color="error" />
                  <Typography
                    variant="body1"
                    color="error"
                    sx={styles.messageText}
                  ><T text="Gagal memuat data ulang tahun." /></Typography>
                </Box>
              )}

              {!error && birthdays.length === 0 && (
                <Box sx={styles.centerBox}>
                  <SentimentDissatisfied sx={styles.icon} />
                  <Typography variant="body1" sx={styles.messageText}><T text="Tidak ada ulang tahun minggu ini." /></Typography>
                </Box>
              )}

              {!error && birthdays.length > 0 && (
                <Box sx={styles.cardsGrid}>
                  {birthdays.map(person => (
                      <Box component="article" key={`${person.nama}-${person.birthday.month}-${person.birthday.day}`} sx={{ borderTop: "1px solid var(--site-border)", py: 3 }}>
                            <Typography component="h2" variant="h6" sx={styles.cardName}>
                              {person.nama}
                            </Typography>
                            <Box sx={styles.cardDateBox}>
                              <Typography variant="body2" sx={styles.cardDate}>
                                <T text={person.dayName} />,{" "}
                                {dateLabel(person.birthdayDate,true)}
                              </Typography>
                            </Box>
                      </Box>
                  ))}
                </Box>
              )}
            </Container>
          </Box>
        </Fade>
      )}
    </Box>
  );
}

export default UlangTahunPage;

const styles = {
  mainContainer: {
    minHeight: "100vh",
    bgcolor: "var(--site-bg)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  festiveBackground1: {
    position: "absolute",
    top: { xs: "10%", sm: "5%" },
    left: { xs: "5%", sm: "10%" },
    width: { xs: "200px", sm: "300px", md: "400px" },
    height: { xs: "200px", sm: "300px", md: "400px" },
    background:
      "radial-gradient(circle, rgba(255, 105, 180, 0.6) 0%, rgba(255, 182, 193, 0.4) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(40px)",
    zIndex: 1,
    animation: "floatBalloon1 15s ease-in-out infinite",
    "@keyframes floatBalloon1": {
      "0%, 100%": {
        transform: "translate(0, 0)",
        opacity: 0.8,
      },
      "25%": {
        transform: "translate(-20px, -30px)",
        opacity: 1,
      },
      "50%": {
        transform: "translate(15px, -50px)",
        opacity: 1,
      },
      "75%": {
        transform: "translate(-10px, -25px)",
        opacity: 0.9,
      },
    },
  },
  festiveBackground2: {
    position: "absolute",
    top: { xs: "30%", sm: "20%" },
    right: { xs: "10%", sm: "15%" },
    width: { xs: "180px", sm: "280px", md: "380px" },
    height: { xs: "180px", sm: "280px", md: "380px" },
    background:
      "radial-gradient(circle, rgba(138, 43, 226, 0.6) 0%, rgba(186, 85, 211, 0.4) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(40px)",
    zIndex: 1,
    animation: "floatBalloon2 18s ease-in-out infinite",
    "@keyframes floatBalloon2": {
      "0%, 100%": {
        transform: "translate(0, 0)",
        opacity: 0.7,
      },
      "33%": {
        transform: "translate(25px, 40px)",
        opacity: 1,
      },
      "66%": {
        transform: "translate(-15px, 20px)",
        opacity: 0.85,
      },
    },
  },
  festiveBackground3: {
    position: "absolute",
    bottom: { xs: "20%", sm: "15%" },
    left: { xs: "15%", sm: "20%" },
    width: { xs: "190px", sm: "260px", md: "350px" },
    height: { xs: "190px", sm: "260px", md: "350px" },
    background:
      "radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(255, 255, 102, 0.35) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(35px)",
    zIndex: 1,
    animation: "floatBalloon3 20s ease-in-out infinite",
    "@keyframes floatBalloon3": {
      "0%, 100%": {
        transform: "translate(0, 0) scale(1)",
        opacity: 0.8,
      },
      "50%": {
        transform: "translate(20px, -35px) scale(1.1)",
        opacity: 1,
      },
    },
  },
  festiveBackground4: {
    position: "absolute",
    bottom: { xs: "10%", sm: "5%" },
    right: { xs: "5%", sm: "10%" },
    width: { xs: "170px", sm: "240px", md: "320px" },
    height: { xs: "170px", sm: "240px", md: "320px" },
    background:
      "radial-gradient(circle, rgba(46, 108, 232, 0.6) 0%, rgba(90, 141, 245, 0.4) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(35px)",
    zIndex: 1,
    animation: "floatBalloon4 16s ease-in-out infinite",
    "@keyframes floatBalloon4": {
      "0%, 100%": {
        transform: "translate(0, 0)",
        opacity: 0.7,
      },
      "40%": {
        transform: "translate(-30px, 20px)",
        opacity: 1,
      },
      "80%": {
        transform: "translate(10px, -15px)",
        opacity: 0.85,
      },
    },
  },
  headerImageContainer: {
    width: "100%",
    position: "relative",
    zIndex: 0,
    mb: 0,
    height: { xs: "150px", sm: "200px" },
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    background: "linear-gradient(to bottom, transparent 0%, var(--site-bg) 100%)",
    pointerEvents: "none",
  },
  contentContainer: {
    px: { xs: 2, sm: 3 },
    py: { xs: 4, sm: 6, md: 8 },
    position: "relative",
    zIndex: 2,
  },
  headerSection: {
    textAlign: "center",
    mb: { xs: 4, sm: 6 },
  },
  title: {
    fontSize: { xs: "2.5rem", sm: "3rem", md: "3.6rem" },
    fontWeight: 350,
    letterSpacing: "-.035em",
    background:
      "linear-gradient(45deg, #ff6b35, #ff8c42, #ffa552, #ff8c42, #ff6b35)",
    backgroundSize: "200% 200%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    animation: "gradientOrange 3s ease infinite",
    mb: 2,
    "@keyframes gradientOrange": {
      "0%": {
        backgroundPosition: "0% 50%",
      },
      "50%": {
        backgroundPosition: "100% 50%",
      },
      "100%": {
        backgroundPosition: "0% 50%",
      },
    },
  },
  countText: {
    fontSize: { xs: "1rem", sm: "1.15rem" },
    fontWeight: 500,
    color: "var(--site-text)",
    mb: 1,
  },
  weekRangeText: {
    fontSize: { xs: "1rem", sm: "1rem" },
    color: "var(--site-muted)",
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    py: 8,
    gap: 2,
  },
  messageText: {
    color: "var(--site-muted)",
    fontSize: { xs: "1rem", sm: "1rem" },
  },
  icon: {
    fontSize: { xs: "3rem", sm: "3.5rem" },
    color: "#999",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, 1fr)",
      md: "repeat(3, 1fr)",
    },
    gap: { xs: 2, sm: 3 },
  },
  cardName: {
    fontSize: { xs: "1.25rem", sm: "1.35rem" },
    fontWeight: 450,
    color: "var(--site-blue)",
    mb: 1,
  },
  cardDateBox: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  },
  cakeIcon: {
    fontSize: "1.1rem",
    color: "var(--site-muted)",
  },
  cardDate: {
    fontSize: { xs: "1rem", sm: "1rem" },
    color: "var(--site-muted)",
  },
};
