"use client";
import Link from "next/link";
import {Box,Button,Container,Typography} from "@mui/material";
import {ThemeProvider} from "@mui/material/styles";
import {createSiteTheme} from "@/app/theme";
import DisplaySettings from "../DisplaySettings";
import ArrowBack from "@mui/icons-material/ArrowBack";
const headerTheme=createSiteTheme(false);
export default function GuestShell({children,readOnly,demo,authenticated}:{children:React.ReactNode;readOnly:boolean;demo:boolean;authenticated:boolean}){
  return <Box className="guest-shell" sx={{minHeight:"100vh",bgcolor:"var(--site-bg)"}}>
    <a className="skip-link" href="#main-content">Langsung ke daftar tamu</a>
    <ThemeProvider theme={headerTheme}><Box component="header" className="admin-header" sx={{bgcolor:"white",borderBottom:"1px solid #dfe5ed"}}><Container maxWidth="lg" sx={{py:2,display:"flex",alignItems:"center",justifyContent:"space-between",gap:2}}><Box><Typography sx={{fontWeight:550,color:"#17324d",fontSize:"1.25rem"}}>GMAHK BSD</Typography><Typography variant="body2" color="text.secondary">{readOnly?"Daftar Tamu · Pembawa Acara":"Daftar Tamu · Penerima Tamu"}</Typography></Box><DisplaySettings/></Container></Box></ThemeProvider>
    <Container className="guest-main" component="main" id="main-content" tabIndex={-1} maxWidth="lg" sx={{py:{xs:3,sm:5}}}>
      <nav aria-label="Breadcrumb" className="admin-breadcrumbs"><ol><li><Link href={authenticated?"/admin":"/admin/login"}>{authenticated?"Dashboard":"Masuk Admin"}</Link></li>{readOnly?<><li><Link href="/tamu">Daftar Tamu</Link></li><li><span aria-current="page">Pembawa Acara</span></li></>:<li><span aria-current="page">Penerima Tamu</span></li>}</ol></nav>
      <Box sx={{display:"flex",gap:1,flexWrap:"wrap",mb:3}}><Button component={Link} href={authenticated?"/admin":"/admin/login"} startIcon={<ArrowBack/>} sx={{minHeight:44,textTransform:"none"}}>{authenticated?"Kembali ke Dashboard":"Kembali ke Login Admin"}</Button><Button component={Link} href="/" sx={{minHeight:44,textTransform:"none"}}>Lihat Website</Button></Box>
      {demo&&<Typography className="guest-demo-note" role="status" sx={{mb:3,color:"var(--site-blue)"}}>Mode latihan lokal. Catatan tidak dikirim ke Google Drive gereja.</Typography>}
      {children}
      <Box component="footer" sx={{mt:5,pt:3,borderTop:"1px solid var(--site-border)"}}><Link href="/">Website Gereja</Link></Box>
    </Container>
  </Box>;
}
