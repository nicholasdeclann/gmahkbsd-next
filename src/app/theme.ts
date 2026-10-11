"use client";

import { createTheme } from "@mui/material/styles";

export function createSiteTheme(dark: boolean) {
  return createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary: { main: dark ? "#8ebaff" : "#1555c0", contrastText: dark ? "#0b182d" : "#ffffff" },
      secondary: { main: dark ? "#b7d0f5" : "#17375e" },
      background: { default: dark ? "#0b1628" : "#ffffff", paper: dark ? "#14243b" : "#ffffff" },
      text: { primary: dark ? "#f3f7ff" : "#142b4b", secondary: dark ? "#b9c9df" : "#52647b" },
    },
    typography: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      body1: { fontSize: "1.125rem", lineHeight: 1.7 },
      body2: { fontSize: "1rem", lineHeight: 1.6 },
      h1: { fontWeight: 350, letterSpacing: "-0.04em" },
      h2: { fontWeight: 350, letterSpacing: "-0.03em" },
      h3: { fontWeight: 350 },
      h4: { fontWeight: 350 },
      h5: { fontWeight: 400 },
      h6: { fontWeight: 450 },
      button: { fontSize: "1rem", fontWeight: 500, textTransform: "none" },
    },
    shape: { borderRadius: 3 },
    components: {
      MuiButton: { styleOverrides: { root: { minHeight: 48, padding: "10px 20px" }, contained: { boxShadow: "none" } } },
      MuiIconButton: { styleOverrides: { root: { minWidth: 48, minHeight: 48 } } },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 52, fontSize: "1.125rem" } } },
      MuiCard: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: "var(--site-bg)", color: "var(--site-text)" } } },
    },
  });
}

export default createSiteTheme(false);
