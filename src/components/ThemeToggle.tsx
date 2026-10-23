"use client";
import Button from "@mui/material/Button";
import { DarkModeOutlined } from "@/components/ui/icons";
import { LightModeOutlined } from "@/components/ui/icons";
import { useColorMode } from "./ColorModeContext";

export default function ThemeToggle() {
  const { dark, toggle } = useColorMode();
  return <Button onClick={toggle} aria-label={dark ? "Gunakan tampilan terang" : "Gunakan tampilan gelap"} startIcon={dark ? <LightModeOutlined /> : <DarkModeOutlined />}>{dark ? "Terang" : "Gelap"}</Button>;
}
