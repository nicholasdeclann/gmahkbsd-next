"use client";
import StatusNote from "@/components/ui/notifications/StatusNote";

import { useActionNotice } from "@/components/ui/notifications/NotificationProvider";
import {useEffect,useRef,useState} from "react";
import { TextField } from "@mui/material";
import {announcementDetails,announcementPatch,nextSabbath,todayJakarta,ANNOUNCEMENT_IMAGE_TYPES,ANNOUNCEMENT_MAX_BYTES,type AnnouncementItem} from "@/lib/announcementTypes";
import {useLanguage} from "./LanguageProvider";
import GlassDialog from "./ui/glass/GlassDialog";
import {GlassButton} from "./ui/glass/GlassControls";
import { SaveOutlined } from "./ui/icons";
import FilledImage from "./ui/glass/FilledImage";
import DueDateField from "./ui/glass/DueDateField";
export default function AnnouncementFormDialog({post,onClose,onSaved}:{post?:AnnouncementItem;onClose:()=>void;onSaved:(post:AnnouncementItem)=>void}){
 const {t}=useLanguage();const legacy=Boolean(post&&/^\d+$/.test(post.id));
 const [title,setTitle]=useState(post?.title||""),[caption,setCaption]=useState(post?.caption||""),[department,setDepartment]=useState(post?.department||""),[due,setDue]=useState(post?.due_date||nextSabbath()),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useActionNotice("error");
 const dueRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!file)return;const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 useEffect(()=>{if(post?.expired||post&&!post.due_date)dueRef.current?.querySelector("input")?.focus();},[post]);
 async function save(){if(busy)return;setError("");let details;
  try{details=post?announcementPatch(legacy?{caption}:{title,caption,department,due_date:due}):announcementDetails({title,caption,department,due_date:due});
   if(!post&&(!file||!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)))throw new Error(t("Pilih gambar JPG, PNG, atau WebP."));
   if(file&&file.size>ANNOUNCEMENT_MAX_BYTES)throw new Error(t("Ukuran gambar maksimal 4 MB."));
  }catch(e){setError(e instanceof Error?t(e.message):t("Formulir tidak valid."));return;}
  setBusy(true);try{let response;
   if(post)response=await fetch("/api/photos/"+encodeURIComponent(post.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(details)});
   else{const form=new FormData();form.append("file",file!);for(const [key,value]of Object.entries(details))form.append(key,String(value??""));response=await fetch("/api/photos/upload",{method:"POST",body:form});}
   const data=await response.json();if(!response.ok)throw new Error(data.error||t("Pengumuman belum berhasil disimpan."));onSaved(data.photo);
  }catch(e){setError(e instanceof Error?t(e.message):t("Pengumuman belum berhasil disimpan."));}finally{setBusy(false);}
 }
 return <GlassDialog open onClose={onClose} title={post?"Edit Pengumuman":"Tambah Pengumuman"} busy={busy} size="md" actions={<><GlassButton tone="plain" disabled={busy} onClick={onClose}>{t("Batal")}</GlassButton><GlassButton tone="primary" startIcon={post?<SaveOutlined/>:undefined} disabled={busy} onClick={()=>void save()}>{t(busy?"Menyimpan…":post?"Simpan":"Terbitkan Pengumuman")}</GlassButton></>}>
  <div className="announcement-form">
   {!post&&<label>{t("Gambar Pengumuman")}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>setFile(e.target.files?.[0]||null)}/><small>JPG / PNG / WebP · 4 MB</small></label>}
   {(preview||post)&&<FilledImage src={preview||post!.image_url} alt={t("Pratinjau gambar pengumuman")} adaptive/>}
   <TextField label={t("Judul pengumuman")} value={title} onChange={e=>setTitle(e.target.value)} disabled={busy||legacy} fullWidth required={!legacy} slotProps={{htmlInput:{maxLength:80}}}/>
   <TextField label={t("Departemen (opsional)")} value={department} onChange={e=>setDepartment(e.target.value)} disabled={busy||legacy} fullWidth/>
   <TextField label={t("Keterangan (opsional)")} multiline minRows={3} value={caption} onChange={e=>setCaption(e.target.value)} disabled={busy} fullWidth slotProps={{htmlInput:{maxLength:2000}}}/>
   {!legacy&&<div ref={dueRef}><DueDateField autoFocus={Boolean(post?.expired||post&&!post.due_date)} value={due} onChange={setDue} disabled={busy} min={post?undefined:todayJakarta()}/></div>}
   {legacy&&<StatusNote severity="info">{t("Pengumuman lama ini hanya mendukung perubahan keterangan.")}</StatusNote>}

  </div>
 </GlassDialog>;
}