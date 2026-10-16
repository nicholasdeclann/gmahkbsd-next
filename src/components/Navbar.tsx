"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button, ListItemIcon, ListSubheader, Menu, MenuItem } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CakeOutlined from "@mui/icons-material/CakeOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import { useLanguage } from "./LanguageProvider";
import DisplaySettings from "./DisplaySettings";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import { createSiteTheme } from "@/app/theme";
const headerTheme=createSiteTheme(false);
const primary=[{label:"Beranda",href:"/",icon:HomeOutlined},{label:"Kertas Acara",href:"/kertas-acara",icon:DescriptionOutlined},{label:"Pengumuman",href:"/pengumuman",icon:CampaignOutlined}];
const community=[{label:"Jadwal Pelayanan",href:"/jadwal-pelayanan",icon:CalendarMonthOutlined},{label:"Ulang Tahun",href:"/ulang-tahun",icon:CakeOutlined},{label:"Kegiatan Jemaat",href:"/kegiatan",icon:PhotoLibraryOutlined}];
export default function Navbar() {
  const pathname=usePathname(),{t}=useLanguage();
  const [menu,setMenu]=useState<{anchor:HTMLElement;mobile:boolean}|null>(null);
  if(pathname.startsWith("/admin")||pathname==="/tamu"||pathname.startsWith("/tamu/"))return null;
  return <ThemeProvider theme={headerTheme}><header className="site-header"><div className="site-width navbar-inner">
    <Link href="/" className="brand" aria-label={`GMAHK BSD — ${t("Beranda")}`}><span className="brand-logo"><Image src={imageAsset(churchConfig.assets.logo)} width={46} height={46} alt="" priority/></span><span>{churchConfig.shortName}<small>Bumi Serpong Damai</small></span></Link>
    <nav className="desktop-nav" aria-label={t("Navigasi utama")}>{primary.map(link=><Link key={link.href} href={link.href} aria-current={pathname===link.href?"page":undefined}>{t(link.label)}</Link>)}<Button endIcon={<ExpandMore/>} aria-haspopup="menu" aria-expanded={Boolean(menu&&!menu.mobile)} aria-controls={menu&&!menu.mobile?"public-navigation":undefined} onClick={event=>setMenu({anchor:event.currentTarget,mobile:false})} className={community.some(link=>link.href===pathname)?"nav-selected":undefined}>{t("Jemaat")}</Button></nav>
    <div className="nav-actions"><Button className="mobile-menu-button" startIcon={<MenuOutlined/>} aria-haspopup="menu" aria-expanded={Boolean(menu?.mobile)} aria-controls={menu?.mobile?"public-navigation":undefined} onClick={event=>setMenu({anchor:event.currentTarget,mobile:true})}>Menu</Button><DisplaySettings/></div>
    <Menu id="public-navigation" anchorEl={menu?.anchor} open={Boolean(menu)} onClose={()=>setMenu(null)} slotProps={{list:{"aria-label":t("Navigasi utama")},paper:{sx:{minWidth:250}}}}>
      {menu?.mobile&&primary.map(link=><MenuItem key={link.href} component={Link} href={link.href} selected={pathname===link.href} aria-current={pathname===link.href?"page":undefined} onClick={()=>setMenu(null)}><ListItemIcon><link.icon fontSize="small"/></ListItemIcon>{t(link.label)}</MenuItem>)}
      <ListSubheader>{t("Jemaat")}</ListSubheader>
      {community.map(link=><MenuItem key={link.href} component={Link} href={link.href} selected={pathname===link.href} aria-current={pathname===link.href?"page":undefined} onClick={()=>setMenu(null)}><ListItemIcon><link.icon fontSize="small"/></ListItemIcon>{t(link.label)}</MenuItem>)}
    </Menu>
  </div></header></ThemeProvider>;
}
