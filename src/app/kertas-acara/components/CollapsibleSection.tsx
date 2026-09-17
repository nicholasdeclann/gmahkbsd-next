import {
  Box,
  Typography,
  List,
  ListItem,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Shared glass-card wrapper for the Kertas Acara sections. Owns the expandable
 * chrome (title bar, expand/collapse icon, animated collapse) and the common
 * card styling so the individual sections only provide their list content.
 */
export default function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <Box
      sx={{
        ...styles.section,
        bgcolor: isExpanded ? "rgba(255, 255, 255, 0.7)" : "transparent",
        border: isExpanded ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
        boxShadow: isExpanded
          ? "0 4px 16px 0 rgba(46, 108, 232, 0.1)"
          : "none",
      }}
    >
      <Box
        sx={{
          ...styles.sectionTitleContainer,
          borderBottom: isExpanded ? "1px solid #dee2e6" : "none",
        }}
        onClick={onToggle}
      >
        <Typography sx={styles.sectionTitle}>{title}</Typography>
        <IconButton size="small" sx={styles.expandIcon}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <List sx={styles.list}>{children}</List>
      </Collapse>
    </Box>
  );
}

/**
 * Shared list-item renderer used by the sections. Supports an optional italic
 * middle value (used by the Khotbah section) and a "lagu" (hymn) accent color.
 */
export function renderListItem(options: {
  key: string;
  label: string;
  value: ReactNode;
  middleValue?: ReactNode;
  isLagu?: boolean;
}) {
  const { key, label, value, middleValue, isLagu } = options;
  return (
    <ListItem key={key} sx={styles.listItem}>
      <Box sx={styles.listItemContent}>
        <Typography sx={{ ...styles.listLabel, ...(isLagu && styles.laguText) }}>
          {label}
        </Typography>
        {middleValue !== undefined && middleValue !== "" && (
          <Typography sx={styles.middleValue}>{middleValue}</Typography>
        )}
        <Typography sx={{ ...styles.listValue, ...(isLagu && styles.laguText) }}>
          {value}
        </Typography>
      </Box>
    </ListItem>
  );
}

export const styles = {
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
    maxWidth: "45%",
    wordBreak: "break-word",
  },
  listValue: {
    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    color: "#111827",
    textAlign: "right",
    flex: "0 0 auto",
    maxWidth: "45%",
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
  laguText: {
    color: "#2e6ce8",
  },
};
