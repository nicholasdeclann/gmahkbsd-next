import { Box, Typography, List, ListItem, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { formatLaguSion } from "../utils";

interface SekolahSabatSectionProps {
  ssData: any;
  doronganPP: string;
  showSongs: boolean;
  laguBukaSSNum: string;
  laguTutupSSNum: string;
  laguSionMap: any;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SekolahSabatSection({
  ssData,
  doronganPP,
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
    <Box sx={styles.section}>
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
        {renderListItem("Sambutan Pemimpin", ssData["pemimpin"]?.person || "")}
        {renderListItem(
          "Lagu Pembuka",
          showSongs ? formatLaguSion(laguBukaSSNum, laguSionMap) : "",
          true,
        )}
        {renderListItem(
          "Ayat Inti & Doa Bertelut",
          ssData["ayat inti/doa buka ss"]?.person || "",
        )}
        {renderListItem(
          "Berita Mission",
          ssData["berita mission"]?.person || "",
        )}
        {renderListItem("Kuis", ssData["kuis sekolah sabat"]?.person || "")}
        {renderListItem(
          "Diskusi Pelajaran SS",
          ssData["diskusi sekolah sabat"]?.person || "",
        )}
        {renderListItem("Lagu Pujian", ssData["lagu pujian"]?.person || "")}
        {renderListItem("Dorongan PP", doronganPP)}
        {renderListItem(
          "Lagu Penutup",
          showSongs ? formatLaguSion(laguTutupSSNum, laguSionMap) : "",
          true,
        )}
        {renderListItem("Doa Penutup", doronganPP)}
        {renderListItem("Pengumuman", "Dept. Komunikasi, Ketua Jemaat")}
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
