"use client";
import {T} from "./LanguageProvider";

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
import { FavoriteBorder } from "@/components/ui/icons";
import { churchConfig } from "@/config/church";

interface PrayerItem {
  id: number;
  name: string;
  note: string | null;
}

export default function PrayerListCard({ showHeading = true }: { showHeading?: boolean }) {
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
        {showHeading && <Box sx={styles.titleContainer}>
          <FavoriteBorder sx={styles.icon} />
          <Typography component="h2" variant="h4" sx={styles.title}>
            <T text={churchConfig.prayerList.title} />
          </Typography>
        </Box>}
        <Card sx={styles.card}>
          <CardContent sx={{ px: 0 }}>
            <List sx={{ p: 0 }}>
              {items.map((item) => (
                <ListItem key={item.id} sx={styles.item}>
                  <Typography sx={styles.name}>{item.id}. {item.name}</Typography>
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
    mb: 3,
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
    color: "var(--site-blue)",
  },
  title: {
    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
    fontWeight: 450,
    color: "var(--site-text)",
    textAlign: "center",
  },
  card: {
    maxWidth: "800px",
    mx: "auto",
    bgcolor: "transparent",

    borderRadius: 3,
    border: "none",
    boxShadow: "none",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    py: { xs: 1.25, sm: 1.5 },
    borderBottom: "1px solid var(--site-border)",
    "&:last-child": { borderBottom: "none" },
  },
  name: {
    fontSize: { xs: "1rem", sm: "1rem" },
    fontWeight: 450,
    color: "var(--site-text)",
  },
  note: {
    fontSize: { xs: "1rem", sm: "1rem" },
    color: "var(--site-muted)",
    fontStyle: "italic",
  },
};
