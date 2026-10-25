"use client";
import {useState} from "react";
import {Alert,TextField} from "@mui/material";
import {useLanguage} from "./LanguageProvider";
import {ShareOutlined,ContentCopy,WhatsApp} from "./ui/icons";
import GlassDialog from "./ui/glass/GlassDialog";
import {GlassButton,GlassIconButton} from "./ui/glass/GlassControls";
export default function AnnouncementShare({id,caption,board=false,iconOnly=false}:{iconOnly?:boolean;id?:string;caption?:string|null;board?:boolean}){
 const {t}=useLanguage();const [url,setUrl]=useState(""),[copied,setCopied]=useState(false),[error,setError]=useState("");
 function open(){const link=new URL("/pengumuman",location.origin);if(id){link.searchParams.set("post",id);link.hash="pengumuman-"+id;}setUrl(link.toString());setCopied(false);setError("");}
 async function copy(){try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setError(t("Salin tautan dari kotak di bawah, lalu kirim ke jemaat."));}}
 return <>{iconOnly?<GlassIconButton onClick={open} aria-label={t("Bagikan")+": "+caption}><ShareOutlined/></GlassIconButton>:<GlassButton tone="plain" startIcon={<ShareOutlined/>} onClick={open}>{t(board?"Bagikan Papan Pengumuman":"Bagikan")}</GlassButton>}
 <GlassDialog open={Boolean(url)} onClose={()=>setUrl("")} title="Bagikan kepada Jemaat" actions={<><GlassButton tone="plain" onClick={()=>setUrl("")}>{t("Tutup")}</GlassButton><GlassButton href={"https://wa.me/?text="+encodeURIComponent((caption||"Pengumuman GMAHK BSD")+"\n"+url)} target="_blank" rel="noopener noreferrer" startIcon={<WhatsApp/>}>WhatsApp</GlassButton><GlassButton tone="primary" startIcon={<ContentCopy/>} onClick={()=>void copy()}>{t("Salin Tautan")}</GlassButton></>}>
 {copied&&<Alert severity="success">{t("Tautan tersalin. Siap dikirim ke jemaat.")}</Alert>}{error&&<Alert severity="info">{error}</Alert>}
 <TextField label={t("Tautan pengumuman")} value={url} fullWidth slotProps={{input:{readOnly:true}}} onFocus={e=>e.target.select()} sx={{mt:2}}/>
 </GlassDialog></>;
}