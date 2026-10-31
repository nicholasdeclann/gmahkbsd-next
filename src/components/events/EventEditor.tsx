"use client";
import StatusNote from "@/components/ui/notifications/StatusNote";

import { useActionNotice } from "@/components/ui/notifications/NotificationProvider";
import { useEffect, useRef, useState } from "react";
import { SaveOutlined } from "../ui/icons";
import GlassDialog from "../ui/glass/GlassDialog";
import FilledImage from "../ui/glass/FilledImage";
import {GlassButton} from "../ui/glass/GlassControls";
import { Box, Button, Checkbox, FormControlLabel, TextField, Typography } from "@mui/material";
import { eventDetails, EVENT_IMAGE_TYPES, EVENT_MAX_BYTES, type EventPhoto } from "@/lib/eventTypes";
type PendingPhoto = {key:string;file:File;url:string;caption:string};
async function resize(file:File):Promise<File> {
  if (!EVENT_IMAGE_TYPES.includes(file.type)) throw new Error("Gunakan gambar JPG, PNG, atau WebP.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Pilih foto di bawah 20 MB sebelum diperkecil.");
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image(); image.src = url; await image.decode();
    const scale = Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.naturalWidth*scale); canvas.height = Math.round(image.naturalHeight*scale);
    const context = canvas.getContext("2d"); if(!context) throw new Error("Foto belum dapat diperkecil.");
    context.fillStyle = "white"; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob = await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.85));
    if(!blob || blob.size > EVENT_MAX_BYTES) throw new Error("Foto masih terlalu besar. Gunakan gambar yang lebih kecil.");
    return new File([blob],file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"});
  } finally {URL.revokeObjectURL(url);}
}
function PendingPreview({photo}:{photo:PendingPhoto}) {return <FilledImage src={photo.url} alt="Pratinjau foto kegiatan" ratio={16/9}/>;}
export default function EventEditor({photo,onClose,onSaved}:{photo?:EventPhoto;onClose:()=>void;onSaved:(month:string)=>void}) {
  const [title,setTitle]=useState(photo?.title||""), [eventDate,setDate]=useState(photo?.eventDate||""), [caption,setCaption]=useState(photo?.caption||"");
  const [published,setPublished]=useState(photo?.published??true), [pending,setPending]=useState<PendingPhoto[]>([]), [busy,setBusy]=useState(false), [error,setError]=useActionNotice("error"), [progress,setProgress]=useState("");
  const [completed,setCompleted]=useState(0);
  const urls=useRef(new Set<string>());
  useEffect(()=>{const allocated=urls.current;return ()=>{allocated.forEach(url=>URL.revokeObjectURL(url));};},[]);
  // Preview URLs are kept stable while typing; cleanup happens only for removed files or closing the dialog.
  async function select(files:FileList|null) {
    if(!files?.length) return;
    if(files.length > 12) {setError("Pilih maksimal 12 foto dalam satu unggahan.");return;}
    setBusy(true);setError("");setProgress("Menyiapkan foto…");
    const prepared:PendingPhoto[]=[];
    try {for(const source of Array.from(files)) {const file=await resize(source);const url=URL.createObjectURL(file);urls.current.add(url);prepared.push({key:crypto.randomUUID(),file,url,caption:""});} pending.forEach(p=>URL.revokeObjectURL(p.url));setPending(prepared);}
    catch(error) {prepared.forEach(p=>URL.revokeObjectURL(p.url));setError(error instanceof Error?error.message:"Foto tidak dapat dibaca.");}
    finally {setBusy(false);setProgress("");}
  }
  async function save() {
    let details;
    try {details=eventDetails({title,eventDate,caption,published});}catch(error){setError((error as Error).message);return;}
    if(!photo && !pending.length){setError("Pilih foto terlebih dahulu.");return;}
    setBusy(true);setError("");
    let succeeded=0;
    try {
      if(photo) {
        const response=await fetch(`/api/events/${photo.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(details)});
        const data=await response.json();if(!response.ok)throw new Error(data.error||"Perubahan belum tersimpan.");
      } else {
        for(const [index,p] of pending.entries()) {
          setProgress(`Mengunggah foto ${index+1} dari ${pending.length}…`);
          const form=new FormData();form.append("file",p.file);form.append("title",details.title);form.append("eventDate",details.eventDate);form.append("caption",p.caption);form.append("published",String(published));
          const response=await fetch("/api/events",{method:"POST",body:form});const data=await response.json();
          if(!response.ok)throw new Error(data.error||"Foto belum tersimpan.");
          succeeded++;
        }
      }
      onSaved(details.eventDate.slice(0,7));
    } catch(error) {
      if(succeeded){setCompleted(count=>count+succeeded);setPending(current=>current.slice(succeeded));}
      setError(`${succeeded?`${succeeded} foto berhasil disimpan. `:""}${error instanceof Error?error.message:"Unggahan belum berhasil."} Foto yang belum tersimpan dapat dicoba kembali.`);
    } finally {setBusy(false);setProgress("");}
  }
  return <GlassDialog open onClose={onClose} title={photo?"Edit Foto Kegiatan":"Tambah Foto Kegiatan"} size="md" busy={busy} actions={<><GlassButton tone="plain" disabled={busy} onClick={onClose}>Tutup</GlassButton><GlassButton tone="primary" startIcon={<SaveOutlined/>} disabled={busy||(!photo&&!pending.length)} onClick={()=>void save()}>{busy?"Menyimpan…":"Simpan"}</GlassButton></>}>
      <Typography color="text.secondary" sx={{mb:3}}>Folder tahun dan bulan dipilih otomatis dari tanggal kegiatan.</Typography>
      <TextField label="Nama kegiatan" value={title} onChange={e=>setTitle(e.target.value)} fullWidth disabled={busy} sx={{mb:3}} slotProps={{htmlInput:{maxLength:150}}}/>
      <TextField label="Tanggal kegiatan" type="date" value={eventDate} onChange={e=>setDate(e.target.value)} fullWidth disabled={busy} sx={{mb:3}} slotProps={{inputLabel:{shrink:true}}} helperText="Tanggal kegiatan berlangsung, bukan tanggal unggahan."/>
      {!photo && <Box sx={{mb:3}}><Typography component="label" htmlFor="event-file-input">Pilih foto (maksimal 12)</Typography><input id="event-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>void select(e.target.files)} style={{display:"block",width:"100%",marginTop:12,fontSize:"1rem"}}/><Typography variant="body2" color="text.secondary">Foto diperkecil otomatis untuk mempercepat pemuatan.</Typography></Box>}
      {photo?<TextField label="Keterangan foto" fullWidth multiline minRows={3} value={caption} onChange={e=>setCaption(e.target.value)} disabled={busy} slotProps={{htmlInput:{maxLength:2000}}}/>:pending.map((p,index)=><Box key={p.key} sx={{borderTop:"1px solid var(--site-border)",pt:2,mb:3}}><PendingPreview photo={p}/><TextField label={`Keterangan foto ${index+1}`} fullWidth multiline minRows={2} value={p.caption} onChange={e=>setPending(current=>current.map(entry=>entry.key===p.key?{...entry,caption:e.target.value}:entry))} disabled={busy} slotProps={{htmlInput:{maxLength:2000}}}/></Box>)}
      <FormControlLabel control={<Checkbox checked={published} onChange={e=>setPublished(e.target.checked)} disabled={busy}/>} label="Tampilkan kepada jemaat"/>
      <Typography variant="body2" color="text.secondary">Jika tidak dicentang, foto disimpan sebagai draf dan hanya terlihat di dashboard.</Typography>
      {completed>0 && <StatusNote severity="info" sx={{mt:2}}>{completed} foto sudah tersimpan. Jangan unggah ulang foto tersebut.</StatusNote>}
      {progress && <Typography role="status" sx={{mt:2}}>{progress}</Typography>}

    </GlassDialog>;
}
