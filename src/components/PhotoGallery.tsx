"use client";

import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import PhotoCard from "./PhotoCard";
import PhotoUploadModal from "./PhotoUploadModal";
import PhotoEditModal from "./PhotoEditModal";

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Array<{
    id: number;
    drive_file_id: string;
    department: string;
    caption: string | null;
    uploaded_by: string | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<{
    id: number;
    caption: string | null;
  } | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/photos?department=Sekolah Sabat");
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch {
      console.error("Failed to fetch photos");
    } finally {
      setLoading(false);
    }
  };

  const handleCaptionSaved = (updatedPhoto: any) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
    );
    setEditingPhoto(null);
  };

  const handlePhotoUploaded = (newPhoto: any) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setShowUpload(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: "100%", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Galeri Foto Sekolah Sabat
        </Typography>
      </Box>

      {/* Photo Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {photos.length === 0 ? (
          <Typography sx={{ color: "#999", py: 4, textAlign: "center", gridColumn: "1 / -1" }}>
            Belum ada foto. Upload foto pertama!
          </Typography>
        ) : (
          photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onEdit={(id: number, caption: string | null) =>
                setEditingPhoto({ id, caption })
              }
            />
          ))
        )}
      </Box>

      {/* Upload Button */}
      <Button
        variant="contained"
        onClick={() => setShowUpload(true)}
        sx={{
          background: "linear-gradient(45deg, #25D366, #128C7E)",
          color: "white",
          textTransform: "none",
          px: 4,
          py: 1.5,
          "&:hover": {
            background: "linear-gradient(45deg, #20bd60, #0f7a66)",
          },
        }}
      >
        Upload Foto
      </Button>

      {/* Upload Modal */}
      {showUpload && (
        <PhotoUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handlePhotoUploaded}
        />
      )}

      {/* Edit Modal */}
      {editingPhoto && (
        <PhotoEditModal
          photoId={editingPhoto.id}
          currentCaption={editingPhoto.caption}
          onClose={() => setEditingPhoto(null)}
          onSaved={handleCaptionSaved}
        />
      )}
    </>
  );
}
