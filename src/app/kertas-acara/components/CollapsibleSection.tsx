import {
  Box,
  Typography,
  List,
  ListItem,
  Collapse,
  ButtonBase,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { useId, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Shared section wrapper for the Kertas Acara sections. Owns the expandable
 * chrome (title bar, expand/collapse icon, animated collapse) and the common
 * list styling so the individual sections only provide their list content.
 */
export default function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const contentId = useId();
  return (
    <Box sx={styles.section}>
      <Box component="h2" sx={{ m: 0 }}>
      <ButtonBase
        aria-expanded={isExpanded}
        aria-controls={contentId}
        sx={{
          ...styles.sectionTitleContainer,
          borderBottom: isExpanded ? "1px solid var(--site-border)" : "none",
        }}
        onClick={onToggle}
      >
        <Typography component="span" sx={styles.sectionTitle}>{title}</Typography>
        {isExpanded ? <ExpandLess sx={styles.expandIcon} /> : <ExpandMore sx={styles.expandIcon} />}
      </ButtonBase>
      </Box>
      <Collapse in={isExpanded} id={contentId}>
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
    bgcolor: "transparent",
    borderRadius: 0,
    borderTop: "1px solid var(--site-border)",
    boxShadow: "none",
    overflow: "hidden",
  },
  sectionTitleContainer: {
    display: "flex",
    width: "100%",
    minHeight: 64,
    justifyContent: "space-between",
    alignItems: "center",
    py: 2,
    px: 0,
    cursor: "pointer",
    "&:hover": {
      bgcolor: "var(--site-soft)",
    },
  },
  sectionTitle: {
    fontSize: { xs: "1.5rem", sm: "1.8rem" },
    fontWeight: 400,
    color: "var(--site-text)",
  },
  expandIcon: {
    color: "var(--site-blue)",
  },
  list: {
    p: 0,
  },
  listItem: {
    py: { xs: 1.5, sm: 2 },
    px: 0,
    borderBottom: "1px solid var(--site-border)",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  listItemContent: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
    alignItems: "flex-start",
    width: "100%",
    gap: { xs: 0.75, sm: 1.5 },
  },
  listLabel: {
    fontSize: "1rem",
    fontWeight: 450,
    color: "var(--site-muted)",
    gridColumn: 1,
    wordBreak: "break-word",
  },
  listValue: {
    fontSize: "1.05rem",
    color: "var(--site-text)",
    textAlign: { xs: "left", sm: "right" },
    gridColumn: { xs: 1, sm: 2 },
    gridRow: { xs: 2, sm: 1 },
    wordBreak: "break-word",
  },
  middleValue: {
    fontSize: "1rem",
    color: "var(--site-muted)",
    textAlign: "left",
    gridColumn: "1 / -1",
    gridRow: { xs: 3, sm: 2 },
    wordBreak: "break-word",
  },
  laguText: {
    color: "var(--site-blue)",
  },
};
