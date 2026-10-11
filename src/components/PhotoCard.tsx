"use client";
import { Box, Button, ButtonBase, Typography } from "@mui/material";
import Image from "next/image";
import AnnouncementShare from "./AnnouncementShare";
import type { AnnouncementItem } from "@/lib/announcementTypes";

export default function PhotoCard({ photo, onEdit, onDelete, onOpen }: { photo: AnnouncementItem; onEdit?: () => void; onDelete?: () => void; onOpen: () => void }) {
  return <Box component="article" id={"pengumuman-" + photo.id} sx={{ scrollMarginTop: 100 }}>
    <ButtonBase onClick={onOpen} aria-label={"Lihat pengumuman " + (photo.caption || photo.department)} sx={{ display: "block", width: "100%" }}>
      <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "var(--site-soft)" }}>
        <Image src={photo.image_url} alt={photo.caption || "Pengumuman " + photo.department} fill unoptimized
          style={{ objectFit: "contain" }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
      </Box>
    </ButtonBase>
    <Box sx={{ pt: 2.5, pb: 3, borderBottom: "1px solid var(--site-border)" }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Typography sx={{ color: "var(--site-blue)", fontSize: ".9rem", fontWeight: 500 }}>{photo.department}</Typography>
        <Typography variant="body2" color="text.secondary">{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" }).format(new Date(photo.created_at))}</Typography>
      </Box>
      {photo.caption && <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, mb: 1 }}>{photo.caption}</Typography>}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
        <Button onClick={onOpen}>Lihat Gambar</Button>
        <AnnouncementShare id={photo.id} caption={photo.caption} />
        {onEdit && <Button onClick={onEdit}>Ubah Keterangan</Button>}
        {onDelete && <Button color="error" onClick={onDelete}>Hapus</Button>}
      </Box>
    </Box>
  </Box>;
}
