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

// Render scale used for the PDF page (see handleDownload). One inch of the
// original PDF is `PDF_DPI * RENDER_SCALE` pixels in the rendered canvas.
const PDF_DPI = 72;
const RENDER_SCALE = 2.5;
const PX_PER_INCH = PDF_DPI * RENDER_SCALE;

// White padding to add around the tight content crop, per side (in inches).
const PADDING_INCHES = { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 };

const pad = {
  top: Math.round(PADDING_INCHES.top * PX_PER_INCH),
  right: Math.round(PADDING_INCHES.right * PX_PER_INCH),
  bottom: Math.round(PADDING_INCHES.bottom * PX_PER_INCH),
  left: Math.round(PADDING_INCHES.left * PX_PER_INCH),
};

/**
 * Crop a canvas to the bounding box of its non-white content, then add white
 * padding around it (per-side, configured above). A pixel counts as "content"
 * if any RGB channel is below `threshold`, which tolerates JPEG-style
 * near-white antialiasing without trimming faint cell borders.
 */
function cropToContent(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  threshold = 240,
): HTMLCanvasElement {
  const { width, height } = source;
  const { data } = context.getImageData(0, 0, width, height);

  const isContent = (x: number, y: number): boolean => {
    const i = (y * width + x) * 4;
    return (
      data[i] < threshold ||
      data[i + 1] < threshold ||
      data[i + 2] < threshold
    );
  };

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isContent(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // No content found — return the original untouched.
  if (maxX < minX || maxY < minY) return source;

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;

  const cropped = document.createElement("canvas");
  cropped.width = contentW + pad.left + pad.right;
  cropped.height = contentH + pad.top + pad.bottom;
  const cropCtx = cropped.getContext("2d");
  if (!cropCtx) return source;

  // Fill with white, then place the cropped content offset by the padding.
  cropCtx.fillStyle = "#ffffff";
  cropCtx.fillRect(0, 0, cropped.width, cropped.height);
  cropCtx.drawImage(
    source,
    minX,
    minY,
    contentW,
    contentH,
    pad.left,
    pad.top,
    contentW,
    contentH,
  );
  return cropped;
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

      // retina-quality output for crisp WhatsApp images
      const viewport = page.getViewport({ scale: RENDER_SCALE });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas not supported");

      // White background so transparent areas don't turn black in the JPG.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      // Tightly crop to the non-white content (exact bounding box, 0 padding).
      const cropped = cropToContent(canvas, context);

      const blob: Blob | null = await new Promise((resolve) =>
        cropped.toBlob((b) => resolve(b), "image/jpeg", 0.95),
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
