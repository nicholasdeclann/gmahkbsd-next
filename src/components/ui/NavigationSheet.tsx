"use client";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { CloseIcon } from "./icons";
import { useLanguage } from "../LanguageProvider";
import { useId, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { useColorMode } from "../ColorModeContext";
import { createSiteTheme } from "@/app/theme";

const themes = { light: createSiteTheme(false), dark: createSiteTheme(true) };

export default function NavigationSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  const { t } = useLanguage();
  const id = useId();
  const { dark } = useColorMode();
  return <ThemeProvider theme={dark ? themes.dark : themes.light}><Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={id} className="navigation-sheet">
    <DialogTitle id={id} className="sheet-heading">{title}<IconButton onClick={onClose} aria-label={t("Tutup")}><CloseIcon /></IconButton></DialogTitle>
    <DialogContent className="sheet-content">{children}</DialogContent>
  </Dialog></ThemeProvider>;
}
