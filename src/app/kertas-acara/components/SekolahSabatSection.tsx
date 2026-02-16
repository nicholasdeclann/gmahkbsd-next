import { Box, Typography, List, ListItem, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { formatLaguSion } from "../utils";

interface SekolahSabatSectionProps {
  ssData: any;
  doronganItem?: { role?: string; person?: string };
  showSongs: boolean;
  laguBukaSSNum: string;
  laguTutupSSNum: string;
  laguSionMap: any;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SekolahSabatSection({
  ssData,
  doronganItem,
  showSongs,
  laguBukaSSNum,
  laguTutupSSNum,
  laguSionMap,
  isExpanded,
  onToggle,
}: SekolahSabatSectionProps) {
  const renderListItem = (label: string, value: string, isLagu?: boolean) => (
    <ListItem key={label} sx={styles.listItem}>
      <Box sx={styles.listItemContent}>
        <Typography
          sx={{ ...styles.listLabel, ...(isLagu && styles.laguLabel) }}
        >
          {label}
        </Typography>
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
        <Typography sx={styles.sectionTitle}>Sekolah Sabat</Typography>
        <IconButton size="small" sx={styles.expandIcon}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <List sx={styles.list}>
        {ssData["pemimpin"]?.person && renderListItem("Sambutan Pemimpin", ssData["pemimpin"]?.person || "")}
        {showSongs && renderListItem(
          "Lagu Pembuka",
          formatLaguSion(laguBukaSSNum, laguSionMap),
          true,
        )}
        {ssData["ayat inti/doa buka ss"]?.person && renderListItem(
          "Ayat Inti & Doa Bertelut",
          ssData["ayat inti/doa buka ss"]?.person || "",
        )}
        {ssData["berita mission"]?.person && renderListItem(
          "Berita Mission",
          ssData["berita mission"]?.person || "",
        )}
        {ssData["kuis sekolah sabat"]?.person && renderListItem("Kuis", ssData["kuis sekolah sabat"]?.person || "")}
        {ssData["diskusi sekolah sabat"]?.person && renderListItem(
          "Diskusi Pelajaran SS",
          ssData["diskusi sekolah sabat"]?.person || "",
        )}
        {ssData["lagu pujian"]?.person && renderListItem("Lagu Pujian", ssData["lagu pujian"]?.person || "")}
        {doronganItem?.person && renderListItem(doronganItem.role || "Dorongan PP", doronganItem.person)}
        {showSongs && renderListItem(
          "Lagu Penutup",
          formatLaguSion(laguTutupSSNum, laguSionMap),
          true,
        )}
        {doronganItem?.person && renderListItem("Doa Penutup", doronganItem.person)}
        {showSongs && renderListItem("Pengumuman", "Dept. Komunikasi, Ketua Jemaat")}
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
    maxWidth: "50%",
    wordBreak: "break-word",
  },
  listValue: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    color: "#111827",
    textAlign: "right",
    flex: "0 0 auto",
    maxWidth: "50%",
    wordBreak: "break-word",
  },
  laguLabel: {
    color: "#2e6ce8",
  },
  laguValue: {
    color: "#2e6ce8",
  },
};
