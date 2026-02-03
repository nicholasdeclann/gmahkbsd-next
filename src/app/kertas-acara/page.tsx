"use client";

import { Box, Container, Typography, Button } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import SekolahSabatSection from "@/app/kertas-acara/components/SekolahSabatSection";
import KhotbahSection from "@/app/kertas-acara/components/KhotbahSection";
import PelayananMusikSection from "@/app/kertas-acara/components/PelayananMusikSection";
import DiakoniaSection from "@/app/kertas-acara/components/DiakoniaSection";
import { SHEET_URL, KERTAS_ACARA_URL, LAGU_SION_URL } from "./constants";
import { getThisWeeksSaturday, formatDate, getSaturdayOfMonth } from "./utils";

export default function KertasAcara() {
  const searchParams = useSearchParams();
  const columnOffset = searchParams.get("week") === "next" ? 1 : 0;

  const [loading, setLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [ssData, setSsData] = useState<any>({});
  const [khotbahData, setKhotbahData] = useState<any>({});
  const [pelayananData, setPelayananData] = useState<any[]>([]);
  const [diakoniaData, setDiakoniaData] = useState<any[]>([]);
  const [laguSionMap, setLaguSionMap] = useState<any>({});
  const [laguBukaNum, setLaguBukaNum] = useState("");
  const [laguTutupNum, setLaguTutupNum] = useState("");
  const [laguBukaSSNum, setLaguBukaSSNum] = useState("");
  const [laguTutupSSNum, setLaguTutupSSNum] = useState("");
  const [judulKhotbah, setJudulKhotbah] = useState("");
  const [ayatInti, setAyatInti] = useState("");
  const [ayatBersahutanText, setAyatBersahutanText] = useState("");
  const [cachedRows, setCachedRows] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(LAGU_SION_URL, { cache: "no-store" }).then((res) => res.text()),
      fetch(KERTAS_ACARA_URL, { cache: "no-store" }).then((res) => res.text()),
      fetch(SHEET_URL, { cache: "no-store" }).then((res) => res.text()),
    ])
      .then(([laguSionText, kertasAcaraText, sheetText]) => {
        const laguSionJson = JSON.parse(
          laguSionText.substring(47, laguSionText.length - 2),
        );
        const laguMap: any = {};
        laguSionJson.table.rows.forEach((row: any) => {
          if (!row.c) return;
          const num = row.c[1]?.v;
          const title = row.c[2]?.v;
          if (num && title) laguMap[num] = title;
        });
        setLaguSionMap(laguMap);

        const kertasAcaraJson = JSON.parse(
          kertasAcaraText.substring(47, kertasAcaraText.length - 2),
        );
        kertasAcaraJson.table.rows.forEach((row: any) => {
          if (!row.c) return;
          const label = (row.c[1]?.v || "").toLowerCase();
          if (label === "lagu buka") {
            setLaguBukaNum(row.c[2]?.v);
            setLaguBukaSSNum(row.c[9]?.v);
          } else if (label === "lagu tutup") {
            setLaguTutupNum(row.c[2]?.v);
            setLaguTutupSSNum(row.c[9]?.v);
          } else if (label === "judul khotbah") {
            setJudulKhotbah(row.c[2]?.v);
          } else if (label === "ayat inti") {
            setAyatInti(row.c[2]?.v);
          } else if (label === "ayat bersahutan") {
            setAyatBersahutanText(row.c[2]?.v);
          }
        });

        const json = JSON.parse(sheetText.substring(47, sheetText.length - 2));
        setCachedRows(json.table.rows);

        const now = new Date();
        const timeString = now.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setLastUpdated(`Data partisipan diambil pada: ${timeString}`);
        setLoading(false);
      })
      .catch(() => {
        setScheduleDate("Gagal memuat jadwal");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!cachedRows) return;

    const thisSaturday = getThisWeeksSaturday(columnOffset);
    const targetDate = formatDate(thisSaturday);
    const saturdayNumber = getSaturdayOfMonth(thisSaturday);

    const dateRow = cachedRows[0];
    let columnIndex = -1;

    if (dateRow && dateRow.c) {
      for (let i = 1; i < dateRow.c.length; i++) {
        const cellValue = dateRow.c[i]?.v || "";
        const formattedValue = dateRow.c[i]?.f || "";
        const searchIn = cellValue + " " + formattedValue;
        if (
          searchIn.includes(targetDate.split(" ")[0]) &&
          searchIn.includes(targetDate.split(" ")[1])
        ) {
          columnIndex = i;
          break;
        }
      }
    }

    if (columnIndex === -1) {
      setScheduleDate(`Jadwal tidak ditemukan untuk ${targetDate}`);
      return;
    }

    setScheduleDate(`Sabat, ${targetDate}`);

    const newSsData: any = {};
    const newKhotbahData: any = {};
    const newPelayananData: any[] = [];
    const newDiakoniaData: any[] = [];

    let currentSection = null;
    let skipNextRow = false;

    for (let i = 4; i < cachedRows.length; i++) {
      if (skipNextRow) {
        skipNextRow = false;
        continue;
      }

      const row = cachedRows[i];
      if (!row.c) continue;

      const role = row.c[0]?.v || "";
      const person = row.c[columnIndex]?.v || "";

      if (
        role.toLowerCase().includes("penyedia potluck") ||
        role.toLowerCase().includes("koordinator")
      )
        continue;

      if (role.includes("DEWASA")) {
        currentSection = "ssDewasa";
        continue;
      } else if (role.includes("KHOTBAH")) {
        currentSection = "khotbah";
        continue;
      } else if (
        role.toLowerCase().includes("diakon") ||
        role.toLowerCase().includes("diakones") ||
        role.toLowerCase().includes("bwa")
      ) {
        currentSection = "diakonia";
      } else if (
        role.toLowerCase().includes("pelayanan musik") ||
        role.toLowerCase().includes("pianist") ||
        role.toLowerCase().includes("keyboardist")
      ) {
        currentSection = "pelayanan";
      }

      if (!role || !person) continue;

      let displayRole = role;
      if (
        role.toLowerCase().includes("dor") &&
        (role.toLowerCase().includes("pp") ||
          role.toLowerCase().includes("rt") ||
          role.toLowerCase().includes("kesehatan"))
      ) {
        if (
          saturdayNumber === 1 ||
          saturdayNumber === 3 ||
          saturdayNumber === 5
        ) {
          displayRole = "Dorongan PP";
        } else if (saturdayNumber === 2) {
          displayRole = "Rumah Tangga";
        } else if (saturdayNumber === 4) {
          displayRole = "Kesehatan";
        }
      }

      const isMultiPersonRole =
        role.toLowerCase().includes("diakon persembahan") ||
        role.toLowerCase().includes("diakones") ||
        role.toLowerCase().includes("bwa");

      let person2 = "";
      if (isMultiPersonRole && i + 1 < cachedRows.length) {
        const nextRow = cachedRows[i + 1];
        const nextRole = nextRow.c?.[0]?.v || "";
        if (!nextRole || nextRole.trim() === "") {
          person2 = nextRow.c?.[columnIndex]?.v || "";
          if (person2) skipNextRow = true;
        }
      }

      const item = { role: displayRole, person, person2 };

      if (currentSection === "ssDewasa") {
        newSsData[role.toLowerCase()] = item;
      } else if (currentSection === "khotbah") {
        newKhotbahData[role.toLowerCase()] = item;
      } else if (currentSection === "pelayanan") {
        newPelayananData.push(item);
      } else if (currentSection === "diakonia") {
        newDiakoniaData.push(item);
      }
    }

    setSsData(newSsData);
    setKhotbahData(newKhotbahData);
    setPelayananData(newPelayananData);
    setDiakoniaData(newDiakoniaData);
  }, [cachedRows, columnOffset]);

  const showSongs = columnOffset === 0;
  const doronganPP = ssData["dor. pp/rt/kesehatan"]?.person || "";
  const bacaanPersembahan = khotbahData["bacaan persembahan"]?.person || "";
  const pembicara = khotbahData["pembicara"]?.person || "";
  const ayatBersahutan = khotbahData["ayat bersahutan & inti"]?.person || "";

  return (
    <Box sx={styles.mainContainer}>
      <Box sx={styles.gradientBackground} />

      <Container maxWidth="lg" sx={styles.contentContainer}>
        <Box sx={styles.header}>
          <Typography variant="h1" sx={styles.title}>
            Kertas Acara GMAHK BSD
          </Typography>

          <Box sx={styles.buttonGroup}>
            <Button
              component={Link}
              href="/kertas-acara"
              variant={columnOffset === 0 ? "contained" : "outlined"}
              sx={
                columnOffset === 0 ? styles.activeButton : styles.inactiveButton
              }
            >
              Sabat Ini
            </Button>
            <Button
              component={Link}
              href="/kertas-acara?week=next"
              variant={columnOffset === 1 ? "contained" : "outlined"}
              endIcon={<ChevronRight />}
              sx={
                columnOffset === 1 ? styles.activeButton : styles.inactiveButton
              }
            >
              Sabat Depan
            </Button>
          </Box>

          <Typography variant="h2" sx={styles.scheduleDate}>
            {scheduleDate}
          </Typography>
          <Typography sx={styles.lastUpdated}>{lastUpdated}</Typography>
        </Box>

        {!loading && (
          <Box sx={styles.scheduleContainer}>
            <SekolahSabatSection
              ssData={ssData}
              doronganPP={doronganPP}
              showSongs={showSongs}
              laguBukaSSNum={laguBukaSSNum}
              laguTutupSSNum={laguTutupSSNum}
              laguSionMap={laguSionMap}
            />
            <KhotbahSection
              khotbahData={khotbahData}
              bacaanPersembahan={bacaanPersembahan}
              pembicara={pembicara}
              ayatBersahutan={ayatBersahutan}
              showSongs={showSongs}
              laguBukaNum={laguBukaNum}
              laguTutupNum={laguTutupNum}
              laguSionMap={laguSionMap}
              judulKhotbah={judulKhotbah}
              ayatInti={ayatInti}
              ayatBersahutanText={ayatBersahutanText}
            />
            <PelayananMusikSection pelayananData={pelayananData} />
            <DiakoniaSection diakoniaData={diakoniaData} />
          </Box>
        )}
      </Container>
    </Box>
  );
}

const styles = {
  mainContainer: {
    minHeight: "calc(100vh - 64px)",
    bgcolor: "white",
    position: "relative",
    overflow: "hidden",
  },
  gradientBackground: {
    position: "absolute",
    top: { xs: "-20%", sm: "-30%" },
    left: "50%",
    transform: "translateX(-50%)",
    width: { xs: "150%", sm: "120%", md: "100%" },
    height: { xs: "60%", sm: "70%", md: "80%" },
    background:
      "radial-gradient(circle, rgba(46, 108, 232, 0.3) 0%, rgba(46, 108, 232, 0.2) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  contentContainer: {
    py: { xs: 3, md: 5 },
    px: 3,
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    mb: { xs: 3, md: 4 },
  },
  title: {
    fontSize: { xs: "1.5rem", sm: "1.75rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    mb: 3,
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: 2,
    mb: 3,
  },
  activeButton: {
    fontSize: "0.9rem",
    textTransform: "none",
    bgcolor: "#2e6ce8",
    color: "white",
    "&:hover": {
      bgcolor: "#1e5cd4",
    },
  },
  inactiveButton: {
    fontSize: "0.85rem",
    textTransform: "none",
    borderColor: "#6c757d",
    color: "#6c757d",
    "&:hover": {
      borderColor: "#2e6ce8",
      color: "#2e6ce8",
      bgcolor: "rgba(46, 108, 232, 0.05)",
    },
  },
  scheduleDate: {
    fontSize: { xs: "1.1rem", sm: "1.25rem" },
    color: "#4a4a4a",
    mb: 1,
  },
  lastUpdated: {
    fontSize: "0.75rem",
    color: "#6c757d",
  },
  scheduleContainer: {
    display: { xs: "flex", md: "grid" },
    flexDirection: { xs: "column" },
    gridTemplateColumns: { md: "repeat(2, 1fr)" },
    gap: { xs: 3, md: 4 },
  },
};
