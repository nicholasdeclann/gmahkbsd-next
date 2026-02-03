import { Box, Typography, List, ListItem, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

interface PelayananMusikSectionProps {
  pelayananData: any[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PelayananMusikSection({
  pelayananData,
  isExpanded,
  onToggle,
}: PelayananMusikSectionProps) {
  return (
    <Box sx={styles.section}>
      <Box
        sx={{
          ...styles.sectionTitleContainer,
          borderBottom: isExpanded ? "1px solid #dee2e6" : "none",
        }}
        onClick={onToggle}
      >
        <Typography sx={styles.sectionTitle}>Pelayanan Musik</Typography>
        <IconButton size="small" sx={styles.expandIcon}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <List sx={styles.list}>
        {pelayananData.map((item, idx) => (
          <ListItem key={idx} sx={styles.listItem}>
            <Box sx={styles.listItemContent}>
              <Typography sx={styles.listLabel}>{item.role}</Typography>
              <Typography sx={styles.listValue}>{item.person}</Typography>
            </Box>
          </ListItem>
        ))}
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
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  listLabel: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    fontWeight: 600,
    color: "#6c757d",
    flex: "0 0 auto",
  },
  listValue: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    color: "#111827",
    textAlign: "right",
    flex: "0 0 auto",
  },
};
