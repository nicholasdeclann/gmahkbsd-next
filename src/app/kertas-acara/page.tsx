"use client";
import { T, useLanguage } from "@/components/LanguageProvider";


import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Fade,
} from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import Search from "@mui/icons-material/Search";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import SekolahSabatSection from "@/app/kertas-acara/components/SekolahSabatSection";
import KhotbahSection from "@/app/kertas-acara/components/KhotbahSection";
import PelayananMusikSection from "@/app/kertas-acara/components/PelayananMusikSection";
import DiakoniaSection from "@/app/kertas-acara/components/DiakoniaSection";
import DownloadButton from "@/app/kertas-acara/components/DownloadButton";
import { loadSheetUrls } from "./constants";
import { getThisWeeksSaturday, formatDate, getSaturdayOfMonth } from "./utils";
import { LaguSionMap, ParticipantData, ParticipantItem, Row } from "./types";
import { churchConfig } from "@/config/church";
import { fetchTextCached, CACHE_TTL } from "@/lib/sheetCache";
import KertasAcaraLoading from "./loading";

const { parsing } = churchConfig.kertasAcara;

function KertasAcaraContent() {
  const {t}=useLanguage();
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    setLoading(true);
    loadSheetUrls().then(({SHEET_URL,KERTAS_ACARA_URL,LAGU_SION_URL})=>Promise.all([
      fetchTextCached(LAGU_SION_URL, CACHE_TTL.liturgy),
      fetchTextCached(KERTAS_ACARA_URL, CACHE_TTL.liturgy),
      fetchTextCached(SHEET_URL, CACHE_TTL.schedule),
    ]))
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
      const roleLower = role.toLowerCase();

      if (
        parsing.skipRoleKeywords.some((kw) =>
          roleLower.includes(kw.toLowerCase()),
        )
      )
        continue;

      if (role.includes(parsing.ssSectionMarker)) {
        currentSection = "ssDewasa";
        continue;
      } else if (role.includes(parsing.khotbahSectionMarker)) {
        currentSection = "khotbah";
        continue;
      } else if (
        parsing.diakoniaKeywords.some((kw) =>
          roleLower.includes(kw.toLowerCase()),
        )
      ) {
        currentSection = "diakonia";
      } else if (
        parsing.pelayananKeywords.some((kw) =>
          roleLower.includes(kw.toLowerCase()),
        )
      ) {
        currentSection = "pelayanan";
      }

      if (!role || !person) continue;

      let displayRole = role;
      if (
        roleLower.includes(parsing.dorongan.matchKeyword.toLowerCase()) &&
        parsing.dorongan.subKeywords.some((kw) =>
          roleLower.includes(kw.toLowerCase()),
        )
      ) {
        const rotated = parsing.dorongan.rotation[saturdayNumber];
        if (rotated) {
          displayRole = rotated;
        }
      }

      const isMultiPersonRole = parsing.multiPersonKeywords.some((kw) =>
        roleLower.includes(kw.toLowerCase()),
      );

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

  const doronganItem = activeSSData["dor. pp/rt/kesehatan"];
  const bacaanPersembahan =
    activeKhotbahData["bacaan persembahan"]?.person || "";
  const pembicara = activeKhotbahData["pembicara"]?.person || "";
  const ayatBersahutan =
    activeKhotbahData["ayat bersahutan & inti"]?.person || "";

  return (
    <Box sx={styles.mainContainer}>
      <header className="site-width page-intro"><p className="eyebrow"><T text="IBADAH & PELAYANAN" /></p><h1><T text="Kertas Acara" /></h1><p><T text="Ikuti susunan ibadah dan lihat jadwal pelayanan jemaat." /></p></header>

      {loading ? (
        <Box role="status" sx={styles.loadingContainer}>
          <CircularProgress size={60} aria-label={t("Memuat kertas acara")} sx={{ color: "var(--site-blue)" }} />
          <Typography sx={{ mt: 2 }}><T text="Memuat jadwal…" /></Typography>
        </Box>
      ) : (
        <Fade in={!loading} timeout={0}>
          <Box className="site-width" sx={styles.contentContainer}>
            <Box sx={styles.header}>
              <Box sx={styles.dateNavigation}>
                {columnOffset === 1 && (
                  <Button
                    component={Link}
                    href="/kertas-acara"
                    variant="outlined"
                    startIcon={<ChevronLeft />}
                    sx={styles.inactiveButton}
                  ><T text="Sabat Ini" /></Button>
                )}
                <Box sx={styles.dateContainer}>
                  <Typography
                    component="p"
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
                  ><T text="Sabat Depan" /></Button>
                )}
              </Box>
            </Box>

            {/* Search */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3, mb: 4 }}>
            <Box sx={styles.searchContainer}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label={t("Cari nama pelayan")}
                    placeholder="Ketik nama…"
                    slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} /> } }}
                    value={searchTerm}
                    onChange={(e: { target: { value: any; }; }) => setSearchTerm(e.target.value)}
                    sx={styles.searchField}
                  />
            </Box>
              <DownloadButton dateLabel={scheduleDate.replace(/^Sabat,\s*/, "")} />
              <Button component={Link} href="/jadwal-pelayanan" variant="outlined"><T text="Jadwal Pelayanan Triwulan" /></Button>
            </Box>

            <Box sx={styles.scheduleContainer}>
              <SekolahSabatSection
                ssData={activeSSData}
                doronganItem={doronganItem}
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

          </Box>
        </Fade>
      )}
    </Box>
  );
}

const styles = {
  mainContainer: {
    minHeight: "65vh",
    bgcolor: "var(--site-bg)",
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 240,
  },
  contentContainer: {
    pt: 0,
    pb: { xs: 5, md: 8 },
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    mb: { xs: 3, md: 4 },
  },
  dateNavigation: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: { xs: 2, sm: 3 },
    flexWrap: "wrap",
    mb: 2,
  },
  dateContainer: {
    flex: "1 1 auto",
    minWidth: 0,
  },
  inactiveButton: {
    fontSize: { xs: "1rem", sm: "1rem" },
    textTransform: "none",
    borderColor: "var(--site-muted)",
    color: "var(--site-muted)",
    px: { xs: 1.5, sm: 2 },
    py: { xs: 0.5, sm: 1 },
    minWidth: { xs: "auto", sm: "64px" },
    "&:hover": {
      borderColor: "var(--site-blue)",
      color: "var(--site-blue)",
      bgcolor: "rgba(46, 108, 232, 0.05)",
    },
  },
  scheduleDateLeft: {
    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
    fontWeight: 450,
    color: "var(--site-text)",
    mb: 0,
    textAlign: "left",
  },
  scheduleDateRight: {
    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
    fontWeight: 450,
    color: "var(--site-text)",
    mb: 0,
    textAlign: "right",
  },
  searchContainer: {
    maxWidth: "500px",
    width: "100%",
    flex: "1 1 300px",
    display: "flex",
    justifyContent: "center",
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      bgcolor: "var(--site-surface)",

      "& fieldset": {
        borderColor: "var(--site-border)",
      },
      "&:hover fieldset": {
        borderColor: "var(--site-blue)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "var(--site-blue)",
      },
    },
  },
  scheduleContainer: {
    display: { xs: "flex", md: "grid" },
    flexDirection: "column",
    gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))" },
    alignItems: { xs: "stretch", md: "start" },
    gap: { xs: 4, md: 5 },
  },
};

export default function KertasAcara() {
  return (
    <Suspense
      fallback={<KertasAcaraLoading />}
    >
      <KertasAcaraContent />
    </Suspense>
  );
}
