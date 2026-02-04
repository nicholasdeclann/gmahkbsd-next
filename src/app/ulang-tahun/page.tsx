"use client";

import {
  Box,
  Container,
  Typography,
  CardContent,
  CircularProgress,
  Fade,
  Grow,
} from "@mui/material";
import { useState, useEffect } from "react";
import Image from "next/image";
import { SentimentDissatisfied, ErrorOutline } from "@mui/icons-material";
import GlassCard from "@/app/ulang-tahun/components/GlassCard";
import {
  type BirthdayPerson,
  SHEET_URL,
  getCurrentWeekRange,
  formatDateShort,
  formatDateLong,
  parseBirthday,
  isBirthdayThisWeek,
  calculateAge,
  getDayName,
  reverseName,
} from "./utils";

function UlangTahunPage() {
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

    // Fetch birthdays from Google Sheets
    fetch(SHEET_URL)
      .then((res) => res.text())
      .then((text) => {
        const json = JSON.parse(text.substring(47, text.length - 2));
        const rows = json.table.rows;

        const birthdayList: BirthdayPerson[] = [];

        // Skip header row (index 0) and process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row.c) continue;

          const nama = reverseName(row.c[1]?.v);
          const tanggalLahir = row.c[2]?.v;

          if (!nama || !tanggalLahir) continue;

          const birthday = parseBirthday(tanggalLahir);

          if (birthday && isBirthdayThisWeek(birthday, range)) {
            const age = calculateAge(birthday);
            const birthdayDate = new Date(
              new Date().getFullYear(),
              birthday.month,
              birthday.day,
            );

            birthdayList.push({
              nama,
              birthday,
              age,
              birthdayDate,
              dayName: getDayName(birthdayDate),
            });
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
          <CircularProgress size={60} sx={{ color: "#2e6ce8" }} />
        </Box>
      ) : (
        <Fade in={!loading} timeout={800}>
          <Box sx={{ width: "100%" }}>
            {/* Festive Background Effects */}
            <Box sx={styles.festiveBackground1} />
            <Box sx={styles.festiveBackground2} />
            <Box sx={styles.festiveBackground3} />
            <Box sx={styles.festiveBackground4} />

            {/* Full-width Header Image */}
            <Box sx={styles.headerImageContainer}>
              <Image
                src="/gmahkbsd-next/assets/images/balloons.jpg"
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
                <Typography variant="h3" sx={styles.title}>
                  Ulang Tahun
                </Typography>
                {weekRange && (
                  <>
                    <Typography variant="h6" sx={styles.countText}>
                      {error ? (
                        "Gagal memuat data"
                      ) : birthdays.length === 0 ? (
                        "Tidak ada yang berulang tahun minggu ini..."
                      ) : (
                        <>
                          {birthdays.length} jemaat berulang tahun minggu ini!
                          🎉
                        </>
                      )}
                    </Typography>
                    <Typography variant="body1" sx={styles.weekRangeText}>
                      {formatDateLong(weekRange.sunday)} -{" "}
                      {formatDateLong(weekRange.saturday)}
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
                  >
                    Gagal memuat data ulang tahun.
                  </Typography>
                </Box>
              )}

              {!error && birthdays.length === 0 && (
                <Box sx={styles.centerBox}>
                  <SentimentDissatisfied sx={styles.icon} />
                  <Typography variant="body1" sx={styles.messageText}>
                    Tidak ada ulang tahun minggu ini.
                  </Typography>
                </Box>
              )}

              {!error && birthdays.length > 0 && (
                <Box sx={styles.cardsGrid}>
                  {birthdays.map((person, index) => (
                    <Grow
                      key={index}
                      in={!loading}
                      timeout={500 + index * 100}
                      style={{ transformOrigin: "center center" }}
                    >
                      <Box>
                        <GlassCard>
                          <CardContent>
                            <Typography variant="h6" sx={styles.cardName}>
                              {person.nama}
                            </Typography>
                            <Box sx={styles.cardDateBox}>
                              <Typography variant="body2" sx={styles.cardDate}>
                                {person.dayName},{" "}
                                {formatDateShort(person.birthdayDate)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </GlassCard>
                      </Box>
                    </Grow>
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
    bgcolor: "white",
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
    background: "linear-gradient(to bottom, transparent 0%, white 100%)",
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
    fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
    fontWeight: 700,
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
    color: "#333",
    mb: 1,
  },
  weekRangeText: {
    fontSize: { xs: "0.9rem", sm: "1rem" },
    color: "#666",
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
    color: "#666",
    fontSize: { xs: "0.95rem", sm: "1rem" },
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
    fontSize: { xs: "1.1rem", sm: "1.15rem" },
    fontWeight: 600,
    color: "#2e6ce8",
    mb: 1,
  },
  cardDateBox: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  },
  cakeIcon: {
    fontSize: "1.1rem",
    color: "#666",
  },
  cardDate: {
    fontSize: { xs: "0.9rem", sm: "0.95rem" },
    color: "#666",
  },
};
