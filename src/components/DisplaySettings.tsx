"use client";
import { useId, useState } from "react";
import { Box, Button, FormControlLabel, Popover, Switch, Typography } from "@mui/material";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { useColorMode } from "./ColorModeContext";
import { useLanguage } from "./LanguageProvider";
export default function DisplaySettings() {
  const [anchor,setAnchor]=useState<HTMLElement|null>(null);
  const {dark,toggle}=useColorMode(),{language,setLanguage,t}=useLanguage();
  const id=useId(),titleId=`${id}-title`,selectId=`${id}-language`;
  return <>
    <Button className="display-settings-trigger" aria-label={t("Tampilan & bahasa")} aria-haspopup="dialog" aria-expanded={Boolean(anchor)} aria-controls={anchor?id:undefined} onClick={event=>setAnchor(event.currentTarget)} startIcon={<SettingsOutlined/>}><span>{t("Pengaturan")}</span></Button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:"bottom",horizontal:"right"}} transformOrigin={{vertical:"top",horizontal:"right"}}>
      <Box id={id} role="dialog" aria-labelledby={titleId} sx={{p:2.5,width:280,maxWidth:"calc(100vw - 32px)"}}>
        <Typography id={titleId} component="h2" sx={{fontSize:"1.1rem",fontWeight:500,mb:2}}>{t("Tampilan & bahasa")}</Typography>
        <Box sx={{display:"flex",alignItems:"center",gap:1.5,mb:2}}><DarkModeOutlined color="action"/><FormControlLabel sx={{m:0,flex:1,justifyContent:"space-between"}} labelPlacement="start" label={t("Mode gelap")} control={<Switch checked={dark} onChange={toggle} inputProps={{"aria-label":t("Mode gelap")}}/>}/></Box>
        <Box sx={{display:"flex",alignItems:"center",gap:1.5}}><TranslateOutlined color="action"/><label htmlFor={selectId}>{t("Bahasa")}</label><select id={selectId} value={language} onChange={event=>setLanguage(event.target.value)} style={{marginLeft:"auto",minHeight:44,padding:"8px",borderRadius:6,border:"1px solid #b7c8d7",background:"transparent",color:"inherit"}}><option value="id" lang="id">Indonesia</option><option value="en" lang="en">English</option></select></Box>
      </Box>
    </Popover>
  </>;
}
