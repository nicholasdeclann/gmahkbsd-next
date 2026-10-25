"use client";
import { TextField } from "@mui/material";
import { addDays, nextSabbath, todayJakarta } from "@/lib/announcementTypes";
import { useLanguage } from "../../LanguageProvider";

/** Native date input (best mobile picker) plus quick picks for the dates staff actually use. */
export default function DueDateField({ value, onChange, disabled, error, helperText, label = "Tanggal berakhir", min, autoFocus }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; error?: boolean; helperText?: string; label?: string; min?: string; autoFocus?: boolean;
}) {
  const { t } = useLanguage();
  const sabbath = nextSabbath();
  const picks = [
    { label: "Sabat ini", value: sabbath },
    { label: "Sabat depan", value: addDays(sabbath, 7) },
    { label: "Dua minggu lagi", value: addDays(todayJakarta(), 14) },
  ].filter(pick => !min || pick.value >= min);
  return (
    <div>
      <TextField type="date" label={t(label)} fullWidth required value={value} onChange={event => onChange(event.target.value)}
        disabled={disabled} error={error} helperText={helperText ? t(helperText) : undefined} autoFocus={autoFocus}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min, "data-initial-focus": autoFocus ? "true" : undefined } }} />
      <div className="due-chips" role="group" aria-label={t("Pilihan cepat tanggal")}>
        {picks.map(pick => (
          <button key={pick.label} type="button" disabled={disabled} aria-pressed={value === pick.value} onClick={() => onChange(pick.value)}>{t(pick.label)}</button>
        ))}
      </div>
    </div>
  );
}
