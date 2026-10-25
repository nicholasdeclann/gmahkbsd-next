"use client";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Dialog, IconButton } from "@mui/material";
import { CloseIcon } from "../icons";
import { useLanguage } from "../../LanguageProvider";
import { useSheetDrag } from "./useSheetDrag";

export interface GlassDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "form" | "confirm" | "media";
  /** While busy the dialog cannot be dismissed (backdrop, Escape, close button, drag). */
  busy?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Inline style for the panel itself (the lightbox sizes the panel to the picture with a CSS variable). */
  paperStyle?: CSSProperties;
}

/**
 * The one modal for the whole site: a centred thick-glass panel on larger screens and a draggable
 * bottom sheet on phones. Focus trapping, Escape, scroll lock and focus return come from MUI Dialog.
 */
export default function GlassDialog({
  open, onClose, title, description, size = "sm", variant = "form", busy = false, actions, children, className = "", paperStyle,
}: GlassDialogProps) {
  const { t } = useLanguage();
  const id = useId();
  const [paper, setPaper] = useState<HTMLElement | null>(null);
  useSheetDrag(paper, onClose, busy);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const close = (
    <IconButton className={variant === "media" ? "glass-icon-btn glass-thin glass-refract glass-dialog__close-float" : "glass-icon-btn"}
      onClick={onClose} disabled={busy} aria-label={t("Tutup")} disableRipple>
      <CloseIcon aria-hidden="true" />
    </IconButton>
  );
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth={false}
      className={`glass-dialog glass-dialog--${size} glass-dialog--${variant} ${className}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      transitionDuration={{ enter: 240, exit: 180 }}
      slotProps={{ paper: { ref: setPaper, className: "glass-thick", style: paperStyle }, transition: { onEntered: () => paper?.querySelector<HTMLElement>("[data-initial-focus=true]")?.focus() } }}
    >
      <div className="glass-dialog__grabber" data-sheet-handle aria-hidden="true" />
      {variant === "media" ? (
        <>
          <h2 id={titleId} className="glass-sr-only">{title}</h2>
          {close}
        </>
      ) : (
        <div className="glass-dialog__header" data-sheet-handle>
          <div>
            <h2 id={titleId}>{t(title)}</h2>
            {description && <p id={descriptionId}>{typeof description === "string" ? t(description) : description}</p>}
          </div>
          {close}
        </div>
      )}
      <div className="glass-dialog__body">{children}</div>
      {actions && <div className="glass-dialog__actions">{actions}</div>}
    </Dialog>
  );
}
