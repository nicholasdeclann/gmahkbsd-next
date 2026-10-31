"use client";
import type { ReactNode } from "react";

import GlassDialog from "./GlassDialog";
import { GlassButton } from "./GlassControls";
import { useLanguage } from "../../LanguageProvider";

/** Destructive and discard confirmations. The close control and Escape cancel safely. */
export default function ConfirmDialog({
  open, onClose, onConfirm, title, subject, message, confirmLabel, busyLabel, busy = false, error, tone = "danger",
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string;
  /** What is being acted on, shown in a quiet box (e.g. the post title). */
  subject?: string;
  message: ReactNode;
  confirmLabel: string; busyLabel?: string; cancelLabel?: string; busy?: boolean; error?: string; tone?: "danger" | "primary";
}) {
  const { t } = useLanguage();
  return (
    <GlassDialog open={open} onClose={onClose} title={title} size="sm" variant="confirm" busy={busy}
      actions={<>
        <GlassButton tone={tone} onClick={onConfirm} disabled={busy}>{busy && busyLabel ? t(busyLabel) : t(confirmLabel)}</GlassButton>
      </>}>
      {subject && <p className="glass-confirm__subject">{subject}</p>}
      <div>{typeof message === "string" ? t(message) : message}</div>
    </GlassDialog>
  );
}
