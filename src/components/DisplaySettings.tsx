"use client";
import { useId, useState } from "react";
import { Box, IconButton, Switch, Typography, FormControlLabel } from "@mui/material";
import { SettingsOutlined, DarkModeOutlined, TranslateOutlined } from "./ui/icons";
import { useColorMode } from "./ColorModeContext";
import { useLanguage } from "./LanguageProvider";
import NavigationSheet from "./ui/NavigationSheet";
export default function DisplaySettings() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useColorMode();
  const { language, setLanguage, t } = useLanguage();
  const selectId = useId();
  return <>
    <IconButton className="display-settings-trigger" aria-label={t("Tampilan & bahasa")} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><SettingsOutlined /></IconButton>
    <NavigationSheet open={open} onClose={() => setOpen(false)} title={t("Pengaturan")}>
      <Box className="preference-row"><DarkModeOutlined aria-hidden="true" /><FormControlLabel labelPlacement="start" label={t("Mode gelap")} control={<Switch checked={dark} onChange={toggle} slotProps={{ input: { role: "switch", "aria-label": t("Mode gelap") } }} />} /></Box>
      <Box className="preference-row"><TranslateOutlined aria-hidden="true" /><Typography component="label" htmlFor={selectId}>{t("Bahasa")}</Typography><select id={selectId} value={language} onChange={event => setLanguage(event.target.value)}><option value="id" lang="id">Indonesia</option><option value="en" lang="en">English</option></select></Box>
    </NavigationSheet>
  </>;
}
