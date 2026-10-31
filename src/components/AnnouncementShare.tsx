"use client";
import { useNotifications } from "./ui/notifications/NotificationProvider";
import {useState} from "react";
import { TextField } from "@mui/material";
import {useLanguage} from "./LanguageProvider";
import {ShareOutlined,ContentCopy,WhatsApp} from "./ui/icons";
import GlassDialog from "./ui/glass/GlassDialog";
import {GlassButton,GlassIconButton} from "./ui/glass/GlassControls";
export default function AnnouncementShare({id,caption,board=false,iconOnly=false}:{iconOnly?:boolean;id?:string;caption?:string|null;board?:boolean}){
 const {t}=useLanguage();const {notify,dismiss}=useNotifications();const [url,setUrl]=useState("");
 function open(){const link=new URL("/pengumuman",location.origin);if(id){link.searchParams.set("post",id);link.hash="pengumuman-"+id;}setUrl(link.toString());dismiss("share-copy");}
 async function copy(){try{await navigator.clipboard.writeText(url);notify({type:"success",key:"share-copy",message:t("Tautan tersalin. Siap dikirim ke jemaat.")});}catch{notify({type:"error",key:"share-copy",message:t("Salin tautan dari kotak di bawah, lalu kirim ke jemaat.")});}}
 return <>{iconOnly?<GlassIconButton onClick={open} aria-label={t("Bagikan")+": "+caption}><ShareOutlined/></GlassIconButton>:<GlassButton tone="plain" startIcon={<ShareOutlined/>} onClick={open}>{t(board?"Bagikan Papan Pengumuman":"Bagikan")}</GlassButton>}
 <GlassDialog open={Boolean(url)} onClose={()=>{setUrl("");dismiss("share-copy");}} title="Bagikan kepada Jemaat" actions={<><GlassButton tone="plain" onClick={()=>{setUrl("");dismiss("share-copy");}}>{t("Tutup")}</GlassButton><GlassButton href={"https://wa.me/?text="+encodeURIComponent((caption||"Pengumuman GMAHK BSD")+"\n"+url)} target="_blank" rel="noopener noreferrer" startIcon={<WhatsApp/>}>WhatsApp</GlassButton><GlassButton tone="primary" startIcon={<ContentCopy/>} onClick={()=>void copy()}>{t("Salin Tautan")}</GlassButton></>}>

 <TextField label={t("Tautan pengumuman")} value={url} fullWidth slotProps={{input:{readOnly:true}}} onFocus={e=>e.target.select()} sx={{mt:2}}/>
 </GlassDialog></>;
}