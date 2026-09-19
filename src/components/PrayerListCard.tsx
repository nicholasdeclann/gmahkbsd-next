"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
} from "@mui/material";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import { churchConfig } from "@/config/church";

interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
}

export default function PrayerListCard() {
  const [items, setItems] = useState<PrayerItem[] | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!churchConfig.prayerList.enabled) return;
    let cancelled = false;
    fetch("/api/prayer", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        // API absent (static export) or errored — hide the card entirely.
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide when disabled, when the API isn't reachable, or when empty this week.
  if (!churchConfig.prayerList.enabled) return null;
  if (!available || !items || items.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box sx={styles.section}>
        <Box sx={styles.titleContainer}>
          <FavoriteBorder sx={styles.icon} />
          <Typography variant="h4" sx={styles.title}>
            {churchConfig.prayerList.title}
          </Typography>
        </Box>
        <Card sx={styles.card}>
          <CardContent>
            <List sx={{ p: 0 }}>
              {items.map((item) => (
                <ListItem key={item.id} sx={styles.item}>
                  <Typography sx={styles.name}>{item.name}</Typography>
                  {item.note && (
                    <Typography sx={styles.note}>{item.note}</Typography>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

const styles = {
  section: {
    width: "100%",
    mb: { xs: 6, sm: 8 },
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    mb: 3,
  },
  icon: {
    fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
    color: "#2e6ce8",
  },
  title: {
    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    textAlign: "center",
  },
  card: {
    maxWidth: "800px",
    mx: "auto",
    bgcolor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: 3,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    py: { xs: 1.25, sm: 1.5 },
    borderBottom: "1px solid rgba(222, 226, 230, 0.5)",
    "&:last-child": { borderBottom: "none" },
  },
  name: {
    fontSize: { xs: "0.95rem", sm: "1rem" },
    fontWeight: 600,
    color: "#111827",
  },
  note: {
    fontSize: { xs: "0.8rem", sm: "0.85rem" },
    color: "#6c757d",
    fontStyle: "italic",
  },
};
