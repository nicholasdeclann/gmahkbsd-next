"use client";
import { forwardRef, useRef, type ElementType, type KeyboardEvent, type ReactNode } from "react";
import { Button, IconButton, type ButtonProps, type IconButtonProps } from "@mui/material";

export type GlassTone = "primary" | "glass" | "plain" | "danger" | "danger-quiet";

export type GlassButtonProps = Omit<ButtonProps, "color" | "variant"> & {
  tone?: GlassTone;
  href?: string;
  target?: string;
  rel?: string;
  component?: ElementType;
};

/** Pill button. Feedback is on press (scale), not just on release, and there is no ripple. */
export function GlassButton({ tone = "glass", className = "", ...props }: GlassButtonProps) {
  const AnyButton = Button as ElementType;
  const surface = tone === "glass" ? " glass-thin glass-refract" : "";
  return <AnyButton disableRipple className={`glass-btn glass-btn--${tone}${surface} ${className}`.trim()} {...props} />;
}

export const GlassIconButton = forwardRef<HTMLButtonElement, IconButtonProps & { surface?: boolean }>(
  function GlassIconButton({ surface = true, className = "", ...props }, ref) {
    return <IconButton ref={ref} disableRipple className={`glass-icon-btn${surface ? " glass-thin glass-refract" : ""} ${className}`.trim()} {...props} />;
  },
);

export function GlassChip({ tone = "neutral", icon, children, className = "" }: {
  tone?: "neutral" | "accent" | "warn" | "muted"; icon?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <span className={`glass-chip glass-thin glass-refract glass-chip--${tone} ${className}`.trim()}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

export interface SegmentedOption { value: string; label: ReactNode; count?: number }

/** Two-or-more way switch, e.g. Aktif / Kedaluwarsa. Arrow keys move the selection. */
export function GlassSegmented({ options, value, onChange, label, panelId, className = "" }: {
  options: SegmentedOption[]; value: string; onChange: (value: string) => void; label: string; panelId?: string; className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.findIndex(o => o.value === value));
  function key(event: KeyboardEvent, current: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }
  return (
    <div role="tablist" aria-label={label} className={`glass-segmented glass-thin glass-refract ${className}`.trim()}
      style={{ ["--n" as string]: options.length, ["--i" as string]: index }}>
      <span className="glass-segmented__thumb" aria-hidden="true" />
      {options.map((option, i) => (
        <button key={option.value} ref={node => { refs.current[i] = node; }} type="button" role="tab" id={panelId?panelId+"-"+option.value:undefined} aria-controls={panelId}
          aria-selected={option.value === value} tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)} onKeyDown={event => key(event, i)}>
          {option.label}
          {option.count !== undefined && <span className="glass-segmented__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
