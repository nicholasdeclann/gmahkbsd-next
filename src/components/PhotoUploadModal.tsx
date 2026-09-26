"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface PhotoUploadModalProps {
  onClose: () => void;
  onUploaded: (photo: any) => void;
}

export default function PhotoUploadModal({ onClose, onUploaded }: PhotoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("department", "Sekolah Sabat");

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploaded(data.photo);
    } catch (err: any) {
      setError(err.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Upload Foto</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            Department: <strong>Sekolah Sabat</strong>
          </Typography>

          <Box
            sx={{
              border: "2px dashed rgba(46, 108, 232, 0.3)",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { borderColor: "#2e6ce8" },
            }}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: "#2e6ce8", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#666" }}>
              Click to select image
            </Typography>
            <Typography variant="caption" sx={{ color: "#999" }}>
              Max 10MB — JPG, PNG, WebP
            </Typography>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Box>

          {file && (
            <Typography variant="body2" sx={{ mt: 2, color: "#2e6ce8" }}>
              Selected: {file.name}
            </Typography>
          )}

          {error && (
            <Typography variant="body2" sx={{ mt: 2, color: "error.main" }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: "#666" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          sx={{
            background: "linear-gradient(45deg, #25D366, #128C7E)",
            color: "white",
            textTransform: "none",
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
