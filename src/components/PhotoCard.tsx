"use client";

import { Box, Card, CardContent, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Image from "next/image";

interface PhotoItem {
  id: number;
  drive_file_id: string;
  department: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface PhotoCardProps {
  photo: PhotoItem;
  onEdit: (id: number, caption: string | null) => void;
}

export default function PhotoCard({ photo, onEdit }: PhotoCardProps) {
  const imageUrl = `https://drive.google.com/uc?export=view&id=${photo.drive_file_id}&maxw=600`;

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(220, 225, 235, 0.6)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(46, 108, 232, 0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Image */}
      <Box sx={{ position: "relative", pt: "75%", overflow: "hidden" }}>
        <Image
          src={imageUrl}
          alt={photo.caption || `Photo ${photo.id}`}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
        />
      </Box>

      {/* Caption */}
      <CardContent sx={{ px: 2, py: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#333",
            fontSize: "0.85rem",
            minHeight: "2.5rem",
            wordBreak: "break-word",
          }}
        >
          {photo.caption || "No caption yet"}
        </Typography>
      </CardContent>

      {/* Edit Button */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <IconButton
          size="small"
          onClick={() => onEdit(photo.id, photo.caption)}
          sx={{
            color: "#2e6ce8",
            border: "1px solid rgba(46, 108, 232, 0.3)",
            "&:hover": {
              bgcolor: "rgba(46, 108, 232, 0.1)",
            },
          }}
        >
          <EditIcon sx={{ fontSize: "0.9rem" }} />
        </IconButton>
      </Box>
    </Card>
  );
}
