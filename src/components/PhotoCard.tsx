"use client";
import { Box, Button, Card, CardActionArea, CardContent, Chip, Typography } from "@mui/material";
import Image from "next/image";
import AnnouncementShare from "./AnnouncementShare";
import type { AnnouncementItem } from "@/lib/announcementTypes";

export default function PhotoCard({ photo, onEdit, onOpen }: { photo: AnnouncementItem; onEdit?: () => void; onOpen: () => void }) {
  return <Card component="article" id={"pengumuman-" + photo.id} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", scrollMarginTop: 100 }}>
    <CardActionArea onClick={onOpen} aria-label={"Lihat pengumuman " + (photo.caption || photo.department)}>
      <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "#f2f5f8" }}>
        <Image src={photo.image_url} alt={photo.caption || "Pengumuman " + photo.department} fill unoptimized
          style={{ objectFit: "contain" }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
      </Box>
    </CardActionArea>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Chip label={photo.department} size="small" variant="outlined" />
        <Typography variant="caption" color="text.secondary">{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" }).format(new Date(photo.created_at))}</Typography>
      </Box>
      {photo.caption && <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, mb: 1 }}>{photo.caption}</Typography>}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
        <Button onClick={onOpen}>Lihat Gambar</Button>
        <AnnouncementShare id={photo.id} caption={photo.caption} />
        {onEdit && <Button onClick={onEdit}>Ubah Keterangan</Button>}
      </Box>
    </CardContent>
  </Card>;
}
