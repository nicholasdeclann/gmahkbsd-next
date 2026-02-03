"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Fade,
  Grow,
} from "@mui/material";
import { ChevronRight, ChevronLeft, Search } from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import SekolahSabatSection from "@/app/kertas-acara/components/SekolahSabatSection";
import KhotbahSection from "@/app/kertas-acara/components/KhotbahSection";
import PelayananMusikSection from "@/app/kertas-acara/components/PelayananMusikSection";
import DiakoniaSection from "@/app/kertas-acara/components/DiakoniaSection";
import { SHEET_URL, KERTAS_ACARA_URL, LAGU_SION_URL } from "./constants";
import { getThisWeeksSaturday, formatDate, getSaturdayOfMonth } from "./utils";
import { LaguSionMap, ParticipantData, ParticipantItem, Row } from "./types";

function KertasAcaraContent() {
  const searchParams = useSearchParams();
  const columnOffset = searchParams.get("week") === "next" ? 1 : 0;

  const [loading, setLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [ssData, setSsData] = useState<ParticipantData>({});
  const [khotbahData, setKhotbahData] = useState<ParticipantData>({});
  const [pelayananData, setPelayananData] = useState<ParticipantItem[]>([]);
  const [diakoniaData, setDiakoniaData] = useState<ParticipantItem[]>([]);
  const [laguSionMap, setLaguSionMap] = useState<LaguSionMap>({});
  const [laguBukaNum, setLaguBukaNum] = useState("");
  const [laguTutupNum, setLaguTutupNum] = useState("");
  const [laguBukaSSNum, setLaguBukaSSNum] = useState("");
  const [laguTutupSSNum, setLaguTutupSSNum] = useState("");
  const [judulKhotbah, setJudulKhotbah] = useState("");
  const [ayatInti, setAyatInti] = useState("");
  const [ayatBersahutanText, setAyatBersahutanText] = useState("");
  const [cachedRows, setCachedRows] = useState<Row[] | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    sekolahSabat: true,
    khotbah: true,
    pelayananMusik: true,
    diakonia: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
        const laguMap: LaguSionMap = {};
        laguSionJson.table.rows.forEach((row: { c?: { v?: string }[] }) => {
          if (!row.c) return;
          const num = row.c[1]?.v;
          const title = row.c[2]?.v;
          if (num && title) laguMap[num] = title;
        });
        setLaguSionMap(laguMap);

        const kertasAcaraJson = JSON.parse(
          kertasAcaraText.substring(47, kertasAcaraText.length - 2),
        );

        kertasAcaraJson.table.rows.forEach((row: { c?: { v?: string }[] }) => {
          if (!row.c) return;
          const label = (row.c[1]?.v || "").toLowerCase();
          if (label === "lagu buka") {
            setLaguBukaNum(row.c[2]?.v ?? "");
            setLaguBukaSSNum(row.c[9]?.v ?? "");
          } else if (label === "lagu tutup") {
            setLaguTutupNum(row.c[2]?.v ?? "");
            setLaguTutupSSNum(row.c[9]?.v ?? "");
          } else if (label === "judul khotbah") {
            setJudulKhotbah(row.c[2]?.v ?? "");
          } else if (label === "ayat inti") {
            setAyatInti(row.c[2]?.v ?? "");
          } else if (label === "ayat bersahutan") {
            setAyatBersahutanText(row.c[2]?.v ?? "");
          }
        });

        const json = JSON.parse(sheetText.substring(47, sheetText.length - 2));
        setCachedRows(json.table.rows);

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

    const newSsData: ParticipantData = {};
    const newKhotbahData: ParticipantData = {};
    const newPelayananData: ParticipantItem[] = [];
    const newDiakoniaData: ParticipantItem[] = [];

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

  // Filter data based on search term
  const filterBySearch = (text: string) => {
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const filteredSsData = Object.keys(ssData).reduce((acc, key) => {
    const item = ssData[key];
    if (
      filterBySearch(item.person) ||
      (item.person2 && filterBySearch(item.person2))
    ) {
      acc[key] = item;
    }
    return acc;
  }, {} as ParticipantData);

  const filteredKhotbahData = Object.keys(khotbahData).reduce((acc, key) => {
    const item = khotbahData[key];
    if (
      filterBySearch(item.person) ||
      (item.person2 && filterBySearch(item.person2))
    ) {
      acc[key] = item;
    }
    return acc;
  }, {} as ParticipantData);

  const filteredPelayananData = pelayananData.filter(
    (item) =>
      filterBySearch(item.person) ||
      (item.person2 && filterBySearch(item.person2)),
  );

  const filteredDiakoniaData = diakoniaData.filter(
    (item) =>
      filterBySearch(item.person) ||
      (item.person2 && filterBySearch(item.person2)),
  );

  // Use filtered data when searching
  const activeSSData = searchTerm ? filteredSsData : ssData;
  const activeKhotbahData = searchTerm ? filteredKhotbahData : khotbahData;

  const doronganPP = activeSSData["dor. pp/rt/kesehatan"]?.person || "";
  const bacaanPersembahan =
    activeKhotbahData["bacaan persembahan"]?.person || "";
  const pembicara = activeKhotbahData["pembicara"]?.person || "";
  const ayatBersahutan =
    activeKhotbahData["ayat bersahutan & inti"]?.person || "";

  return (
    <Box sx={styles.mainContainer}>
      <Box sx={styles.gradientBackground} />

      {loading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={60} sx={{ color: "#2e6ce8" }} />
        </Box>
      ) : (
        <Fade in={!loading} timeout={800}>
          <Container maxWidth="lg" sx={styles.contentContainer}>
            <Box sx={styles.header}>
              <Box sx={styles.dateNavigation}>
                {columnOffset === 1 && (
                  <Button
                    component={Link}
                    href="/kertas-acara"
                    variant="outlined"
                    startIcon={<ChevronLeft />}
                    sx={styles.inactiveButton}
                  >
                    Sabat Ini
                  </Button>
                )}
                <Box sx={styles.dateContainer}>
                  <Typography
                    variant="h2"
                    sx={
                      columnOffset === 0
                        ? styles.scheduleDateLeft
                        : styles.scheduleDateRight
                    }
                  >
                    {scheduleDate}
                  </Typography>
                </Box>
                {columnOffset === 0 && (
                  <Button
                    component={Link}
                    href="/kertas-acara?week=next"
                    variant="outlined"
                    endIcon={<ChevronRight />}
                    sx={styles.inactiveButton}
                  >
                    Sabat Depan
                  </Button>
                )}
              </Box>
            </Box>

            {/* Search */}
            <Box sx={styles.searchContainer}>
              {!isSearchVisible ? (
                <IconButton
                  onClick={() => setIsSearchVisible(true)}
                  sx={styles.searchIconButton}
                >
                  <Search />
                </IconButton>
              ) : (
                <Grow in={isSearchVisible} timeout={300}>
                  <TextField
                    fullWidth
                    autoFocus
                    variant="outlined"
                    placeholder="Cari Nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      if (!searchTerm) {
                        setIsSearchVisible(false);
                      }
                    }}
                    sx={styles.searchField}
                  />
                </Grow>
              )}
            </Box>

            <Box sx={styles.scheduleContainer}>
              <SekolahSabatSection
                ssData={activeSSData}
                doronganPP={doronganPP}
                showSongs={searchTerm ? false : showSongs}
                laguBukaSSNum={laguBukaSSNum}
                laguTutupSSNum={laguTutupSSNum}
                laguSionMap={laguSionMap}
                isExpanded={expandedSections.sekolahSabat}
                onToggle={() => toggleSection("sekolahSabat")}
              />
              <KhotbahSection
                khotbahData={activeKhotbahData}
                bacaanPersembahan={bacaanPersembahan}
                pembicara={pembicara}
                ayatBersahutan={ayatBersahutan}
                showSongs={searchTerm ? false : showSongs}
                laguBukaNum={laguBukaNum}
                laguTutupNum={laguTutupNum}
                laguSionMap={laguSionMap}
                judulKhotbah={judulKhotbah}
                ayatInti={ayatInti}
                ayatBersahutanText={ayatBersahutanText}
                isExpanded={expandedSections.khotbah}
                onToggle={() => toggleSection("khotbah")}
              />
              <PelayananMusikSection
                pelayananData={
                  searchTerm ? filteredPelayananData : pelayananData
                }
                isExpanded={expandedSections.pelayananMusik}
                onToggle={() => toggleSection("pelayananMusik")}
              />
              <DiakoniaSection
                diakoniaData={searchTerm ? filteredDiakoniaData : diakoniaData}
                isExpanded={expandedSections.diakonia}
                onToggle={() => toggleSection("diakonia")}
              />
            </Box>
          </Container>
        </Fade>
      )}
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
    display: "none",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
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
  dateNavigation: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: { xs: 1, sm: 2 },
    mb: 2,
  },
  dateContainer: {
    flex: "1 1 auto",
    minWidth: 0,
  },
  activeButton: {
    fontSize: { xs: "1.2rem", sm: "0.9rem" },
    textTransform: "none",
    bgcolor: "#2e6ce8",
    color: "white",
    px: { xs: 1, sm: 2 },
    py: { xs: 0.5, sm: 1 },
    minWidth: { xs: "36px", sm: "64px" },
    "&:hover": {
      bgcolor: "#1e5cd4",
    },
  },
  inactiveButton: {
    fontSize: { xs: "0.85rem", sm: "0.85rem" },
    textTransform: "none",
    borderColor: "#6c757d",
    color: "#6c757d",
    px: { xs: 1.5, sm: 2 },
    py: { xs: 0.5, sm: 1 },
    minWidth: { xs: "auto", sm: "64px" },
    "&:hover": {
      borderColor: "#2e6ce8",
      color: "#2e6ce8",
      bgcolor: "rgba(46, 108, 232, 0.05)",
    },
  },
  scheduleDate: {
    fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
    color: "#4a4a4a",
    mb: 0,
  },
  scheduleDateLeft: {
    fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
    fontWeight: 700,
    color: "#4a4a4a",
    mb: 0,
    textAlign: "left",
  },
  scheduleDateRight: {
    fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
    fontWeight: 700,
    color: "#4a4a4a",
    mb: 0,
    textAlign: "right",
  },
  lastUpdated: {
    fontSize: "0.75rem",
    color: "#6c757d",
  },
  searchContainer: {
    mb: { xs: 3, md: 4 },
    maxWidth: "300px",
    mx: "auto",
    display: "flex",
    justifyContent: "center",
  },
  searchIconButton: {
    color: "#2e6ce8",
    bgcolor: "rgba(46, 108, 232, 0.1)",
    "&:hover": {
      bgcolor: "rgba(46, 108, 232, 0.2)",
    },
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(10px)",
      "& fieldset": {
        borderColor: "rgba(46, 108, 232, 0.3)",
      },
      "&:hover fieldset": {
        borderColor: "#2e6ce8",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#2e6ce8",
      },
    },
  },
  scheduleContainer: {
    display: { xs: "flex", md: "grid" },
    flexDirection: { xs: "column" },
    gridTemplateColumns: { md: "repeat(2, 1fr)" },
    gap: { xs: 3, md: 4 },
  },
};

export default function KertasAcara() {
  return (
    <Suspense
      fallback={
        <Box sx={styles.mainContainer}>
          <Box sx={styles.gradientBackground} />
          <Container maxWidth="lg" sx={styles.contentContainer}>
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={40} sx={{ color: "#2e6ce8" }} />
              <Typography sx={{ mt: 2, color: "#6c757d" }}>
                Memuat jadwal...
              </Typography>
            </Box>
          </Container>
        </Box>
      }
    >
      <KertasAcaraContent />
    </Suspense>
  );
}
