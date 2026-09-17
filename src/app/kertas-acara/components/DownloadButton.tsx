"use client";

import { useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import Download from "@mui/icons-material/Download";
import { churchConfig } from "@/config/church";
import { buildSheetExportUrl } from "@/lib/kertasAcaraExport";

interface DownloadButtonProps {
  /** Date label used in the downloaded filename, e.g. "19 Sep 2026". */
  dateLabel?: string;
}

export default function DownloadButton({ dateLabel }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const filenameBase = `kertas-acara${
    dateLabel ? `-${dateLabel.replace(/\s+/g, "-")}` : ""
  }`;

  const triggerBrowserDownload = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(false);
    try {
      // Fetch the PDF via our proxy (Vercel). If the API is unavailable
      // (e.g. a static-export host), fall back to Google's export URL.
      let pdfData: ArrayBuffer;
      try {
        const res = await fetch("/api/kertas-acara/export", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        pdfData = await res.arrayBuffer();
      } catch {
        // Fallback: let the browser download the PDF directly from Google.
        triggerBrowserDownload(
          buildSheetExportUrl(churchConfig.kertasAcara.export),
          `${filenameBase}.pdf`,
        );
        return;
      }

      // Render the first PDF page to a high-resolution canvas, then export JPG.
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(1);

      const scale = 2.5; // retina-quality output for crisp WhatsApp images
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas not supported");

      // White background so transparent areas don't turn black in the JPG.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95),
      );
      if (!blob) throw new Error("Failed to create image");

      const objectUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(objectUrl, `${filenameBase}.jpg`);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Button
        variant="contained"
        size="large"
        onClick={handleDownload}
        disabled={loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} sx={{ color: "white" }} />
          ) : (
            <Download />
          )
        }
        sx={styles.button}
      >
        {loading ? "Menyiapkan..." : "Unduh Kertas Acara (JPG)"}
      </Button>
      {error && (
        <Box sx={styles.errorText}>
          Gagal mengunduh. Silakan coba lagi.
        </Box>
      )}
    </Box>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1.5,
    mt: { xs: 4, md: 5 },
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
    fontSize: { xs: "0.9rem", sm: "0.95rem" },
    px: 3,
    py: 1.25,
    borderRadius: 2,
    bgcolor: "#2e6ce8",
    "&:hover": {
      bgcolor: "#1e5cd4",
    },
  },
  errorText: {
    fontSize: "0.85rem",
    color: "#d32f2f",
  },
};
