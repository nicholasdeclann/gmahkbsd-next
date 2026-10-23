"use client";
import Link from "next/link";
import { Box, Container, IconButton, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createSiteTheme } from "@/app/theme";
import { ArrowBack } from "../ui/icons";
import DisplaySettings from "../DisplaySettings";
const headerTheme = createSiteTheme(false);
export default function GuestShell({ children, readOnly, demo }: { children: React.ReactNode; readOnly: boolean; demo: boolean }) {
  return <Box sx={{ minHeight:"100dvh",bgcolor:"var(--site-bg)" }}>
    <a className="skip-link" href="#main-content">Langsung ke daftar tamu</a>
    <ThemeProvider theme={headerTheme}><Box component="header" className="admin-header guest-header glass-header">
      <Container maxWidth="lg" sx={{display:"flex",alignItems:"center"}}>
        <IconButton component={Link} href="/" aria-label="Website Gereja"><ArrowBack /></IconButton>
        <div className="staff-brand"><Link href="/">GMAHK BSD<small>{readOnly?"Pembawa Acara":"Penerima Tamu"}</small></Link></div>
        <DisplaySettings />
      </Container>
    </Box></ThemeProvider>
    <Container component="main" className="guest-content" id="main-content" tabIndex={-1} maxWidth="lg">
      {demo && <Typography role="status" className="admin-demo-note">Mode latihan lokal · catatan tidak dikirim ke Google Drive gereja.</Typography>}
      {children}
    </Container>
  </Box>;
}