import { Box, Typography, List, ListItem, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { formatLaguSion } from "../utils";

interface KhotbahSectionProps {
  khotbahData: any;
  bacaanPersembahan: string;
  pembicara: string;
  ayatBersahutan: string;
  showSongs: boolean;
  laguBukaNum: string;
  laguTutupNum: string;
  laguSionMap: any;
  judulKhotbah: string;
  ayatInti: string;
  ayatBersahutanText: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function KhotbahSection({
  khotbahData,
  bacaanPersembahan,
  pembicara,
  ayatBersahutan,
  showSongs,
  laguBukaNum,
  laguTutupNum,
  laguSionMap,
  judulKhotbah,
  ayatInti,
  ayatBersahutanText,
  isExpanded,
  onToggle,
}: KhotbahSectionProps) {
  const renderListItem = (
    key: string,
    label: string,
    value: string,
    middleValue?: string,
    isLagu?: boolean,
  ) => (
    <ListItem key={key} sx={styles.listItem}>
      <Box sx={styles.listItemContent}>
        <Typography
          sx={{ ...styles.listLabel, ...(isLagu && styles.laguLabel) }}
        >
          {label}
        </Typography>
        {middleValue && (
          <Typography sx={styles.middleValue}>{middleValue}</Typography>
        )}
        <Typography
          sx={{ ...styles.listValue, ...(isLagu && styles.laguValue) }}
        >
          {value}
        </Typography>
      </Box>
    </ListItem>
  );

  return (
    <Box sx={{
      ...styles.section,
      bgcolor: isExpanded ? "rgba(255, 255, 255, 0.7)" : "transparent",
      border: isExpanded ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
      boxShadow: isExpanded ? "0 4px 16px 0 rgba(46, 108, 232, 0.1)" : "none",
    }}>
      <Box
        sx={{
          ...styles.sectionTitleContainer,
          borderBottom: isExpanded ? "1px solid #dee2e6" : "none",
        }}
        onClick={onToggle}
      >
        <Typography sx={styles.sectionTitle}>Khotbah</Typography>
        <IconButton size="small" sx={styles.expandIcon}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <List sx={styles.list}>
        {showSongs && renderListItem(
          "lagu-partisipan-khotbah",
          "Lagu Partisipan Khotbah",
          formatLaguSion("421", laguSionMap),
          undefined,
          true,
        )}
        {showSongs && renderListItem(
          "lagu-pembuka",
          "Lagu Pembuka",
          formatLaguSion(laguBukaNum, laguSionMap),
          undefined,
          true,
        )}
        {khotbahData["doa syafaat"]?.person && renderListItem(
          "doa-syafaat",
          "Doa Syafaat",
          khotbahData["doa syafaat"]?.person || "",
        )}
        {bacaanPersembahan && renderListItem(
          "bacaan-persembahan",
          "Bacaan Persembahan",
          bacaanPersembahan,
        )}
        {showSongs && renderListItem(
          "lagu-persembahan",
          "Lagu Persembahan",
          "Instrumental",
          undefined,
          true,
        )}
        {showSongs && renderListItem(
          "lagu-sambutan-1",
          "Lagu Sambutan",
          formatLaguSion("21", laguSionMap),
          undefined,
          true,
        )}
        {bacaanPersembahan && renderListItem(
          "doa-persembahan",
          "Doa Persembahan",
          bacaanPersembahan,
        )}
        {(khotbahData["lagu pujian"]?.person || khotbahData["lagu pujian 1"]?.person) && renderListItem(
          "lagu-pujian-1",
          "Lagu Pujian",
          khotbahData["lagu pujian"]?.person ||
            khotbahData["lagu pujian 1"]?.person ||
            "",
        )}
        {khotbahData["cerita anak"]?.person && renderListItem(
          "cerita-anak",
          "Cerita Anak",
          khotbahData["cerita anak"]?.person || "",
        )}
        {khotbahData["lagu pujian 2"]?.person && renderListItem(
          "lagu-pujian-2",
          "Lagu Pujian",
          khotbahData["lagu pujian 2"]?.person || "",
        )}
        {ayatBersahutan && renderListItem(
          "ayat-bersahutan",
          "Ayat Bersahutan",
          ayatBersahutan,
          showSongs ? ayatBersahutanText : undefined,
        )}
        {ayatBersahutan && renderListItem(
          "ayat-inti",
          "Ayat Inti",
          ayatBersahutan,
          showSongs ? ayatInti : undefined,
        )}
        {showSongs && renderListItem(
          "lagu-sambutan-khotbah",
          "Lagu Sambutan Khotbah",
          formatLaguSion("524", laguSionMap),
          undefined,
          true,
        )}
        {pembicara && renderListItem("doa-pendek", "Doa Pendek", pembicara)}
        {(khotbahData["khotbah"]?.person || pembicara) && renderListItem(
          "khotbah",
          "Khotbah",
          khotbahData["khotbah"]?.person || pembicara,
          showSongs ? judulKhotbah : undefined,
        )}
        {showSongs && renderListItem(
          "lagu-penutup",
          "Lagu Penutup",
          formatLaguSion(laguTutupNum, laguSionMap),
          undefined,
          true,
        )}
        {pembicara && renderListItem("doa-penutup", "Doa Penutup", pembicara)}
        {showSongs && renderListItem(
          "lagu-sambutan-2",
          "Lagu Sambutan",
          formatLaguSion("168", laguSionMap),
          undefined,
          true,
        )}
      </List>
      </Collapse>
    </Box>
  );
}

const styles = {
  section: {
    bgcolor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: 2,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
    overflow: "hidden",
  },
  sectionTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 2,
    px: { xs: 2, sm: 3 },
    cursor: "pointer",
    "&:hover": {
      bgcolor: "rgba(46, 108, 232, 0.05)",
    },
  },
  sectionTitle: {
    fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" },
    fontWeight: 700,
    color: "#2e6ce8",
  },
  expandIcon: {
    color: "#2e6ce8",
  },
  list: {
    p: 0,
  },
  listItem: {
    py: { xs: 1.5, sm: 2 },
    px: { xs: 2, sm: 3 },
    borderBottom: "1px solid rgba(222, 226, 230, 0.5)",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  listItemContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    gap: 2,
  },
  listLabel: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    fontWeight: 600,
    color: "#6c757d",
    flex: "0 0 auto",
    maxWidth: "40%",
    wordBreak: "break-word",
  },
  listValue: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    color: "#111827",
    textAlign: "right",
    flex: "0 0 auto",
    maxWidth: "40%",
    wordBreak: "break-word",
  },
  middleValue: {
    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.85rem" },
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    flex: "1 1 auto",
    wordBreak: "break-word",
  },
  laguLabel: {
    color: "#2e6ce8",
  },
  laguValue: {
    color: "#2e6ce8",
  },
};
