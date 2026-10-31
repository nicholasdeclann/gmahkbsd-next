"use client";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { ExpandMore } from "../ui/icons";
import { useLanguage } from "../LanguageProvider";

export default function GuestPaxField({ value, onChange, disabled, label, ariaLabel }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean; label?: string; ariaLabel?: string }) {
  const { t } = useLanguage();
  const amount = value ?? 1;
  return <TextField className="guest-pax-input" size="small" type="number" fullWidth label={label} value={value ?? ""} disabled={disabled}
    onKeyDown={event => { if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault(); }}
    onPaste={event => { if (!/^\d+$/.test(event.clipboardData.getData("text"))) event.preventDefault(); }}
    onChange={event => { const raw = event.target.value; if (!raw) onChange(null); else if (/^\d+$/.test(raw) && Number(raw) >= 1 && Number(raw) <= 999) onChange(Number(raw)); }}
    onBlur={() => { if (value === null) onChange(1); }}
    slotProps={{ htmlInput: { "aria-label": ariaLabel ?? label, min: 1, max: 999, step: 1, inputMode: "numeric" }, input: { endAdornment: <InputAdornment position="end" className="guest-pax-stepper">
      <IconButton type="button" size="small" aria-label={t("Kurangi jumlah") + (ariaLabel ? ` · ${ariaLabel}` : "")} disabled={disabled || amount <= 1} onClick={() => onChange(Math.max(1, amount - 1))}><ExpandMore/></IconButton>
      <IconButton type="button" size="small" aria-label={t("Tambah jumlah") + (ariaLabel ? ` · ${ariaLabel}` : "")} disabled={disabled || amount >= 999} onClick={() => onChange(Math.min(999, amount + 1))}><ExpandMore sx={{ transform: "rotate(180deg)" }}/></IconButton>
    </InputAdornment> } }}/>
}
