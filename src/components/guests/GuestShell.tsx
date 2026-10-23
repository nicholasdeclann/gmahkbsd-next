"use client";
import Link from "next/link";
import { Box, Container, IconButton, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createSiteTheme } from "@/app/theme";
import { ArrowBack } from "../ui/icons";
import DisplaySettings from "../DisplaySettings";
const headerTheme = createSiteTheme(false);
export default function GuestShell({ children, readOnly, demo, authenticated }: { children: React.ReactNode; readOnly: boolean; demo: boolean; authenticated: boolean }) {
  return <Box className="guest-shell" sx={{ minHeight:"100dvh",bgcolor:"var(--site-bg)" }}>
    <a className="skip-link" href="#main-content">Langsung ke daftar tamu</a>
    <ThemeProvider theme={headerTheme}><Box component="header" className="admin-header guest-header glass-header">
      <Container maxWidth="lg" sx={{display:"flex",alignItems:"center"}}>
        <IconButton component={Link} href={authenticated?"/admin":"/admin/login"} aria-label={authenticated?"Kembali ke Dashboard":"Kembali ke Login Admin"}><ArrowBack /></IconButton>
        <div className="staff-brand"><Link href="/">GMAHK BSD<small>{readOnly?"Pembawa Acara":"Penerima Tamu"}</small></Link></div>
        <DisplaySettings />
      </Container>
    </Box></ThemeProvider>
    <Container component="main" className="guest-content guest-main" id="main-content" tabIndex={-1} maxWidth="lg">
      <nav aria-label="Breadcrumb" className="admin-breadcrumbs"><ol><li><Link href={authenticated?"/admin":"/admin/login"}>{authenticated?"Dashboard":"Masuk Admin"}</Link></li>{readOnly?<><li><Link href="/tamu">Daftar Tamu</Link></li><li><span aria-current="page">Pembawa Acara</span></li></>:<li><span aria-current="page">Penerima Tamu</span></li>}</ol></nav>
      {demo && <Typography role="status" className="admin-demo-note">Mode latihan lokal · catatan tidak dikirim ke Google Drive gereja.</Typography>}
      {children}
    </Container>
  </Box>;
}