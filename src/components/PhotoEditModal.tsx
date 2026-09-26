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

interface PhotoEditModalProps {
  photoId: number;
  currentCaption: string | null;
  onClose: () => void;
  onSaved: (updatedPhoto: any) => void;
}

export default function PhotoEditModal({
  photoId,
  currentCaption,
  onClose,
  onSaved,
}: PhotoEditModalProps) {
  const [caption, setCaption] = useState(currentCaption || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: caption || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      const data = await res.json();
      onSaved(data.photo);
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Caption</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="caption" sx={{ color: "#999" }}>
            Photo ID: {photoId}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Enter caption..."
            sx={{ mt: 2 }}
            variant="outlined"
            size="small"
          />
          {error && (
            <Typography variant="body2" sx={{ mt: 1, color: "error.main" }}>
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
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: "linear-gradient(45deg, #2e6ce8, #5a8df5)",
            color: "white",
            textTransform: "none",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
