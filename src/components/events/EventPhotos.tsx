"use client";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";

import { T, useLanguage } from "@/components/LanguageProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { jakartaMonth, monthLabel, previousMonth, type EventPhoto } from "@/lib/eventTypes";
import EventEditor from "./EventEditor";
import ArrowBackIosNewRounded from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRounded from "@mui/icons-material/ArrowForwardIosRounded";
import PauseCircleOutline from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
function dateLabel(date:string,language="id"){return new Intl.DateTimeFormat(language==="en"?"en-GB":"id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(`${date}T12:00:00+07:00`));}
function PhotoImage({photo,large=false}:{photo:EventPhoto;large?:boolean}) {
  const [failed,setFailed]=useState(false);
  return failed?<div className="event-image-error" role="status"><T text="Foto belum dapat dimuat." /></div>:<Image src={photo.imageUrl} alt={photo.caption||photo.title} width={1600} height={1000} unoptimized onError={()=>setFailed(true)} style={{width:"100%",height:large?"auto":undefined,maxHeight:large?"75vh":undefined,objectFit:"contain"}}/>;
}
export default function EventPhotos({manage=false,carousel=false}:{manage?:boolean;carousel?:boolean}) {
  const {t,language}=useLanguage();
  const [month,setMonth]=useState(()=>manage?jakartaMonth():previousMonth());
  const [photos,setPhotos]=useState<EventPhoto[]>([]), [cursor,setCursor]=useState<string|null>(null), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [editor,setEditor]=useState<EventPhoto|"new"|null>(null), [preview,setPreview]=useState<EventPhoto|null>(null), [deleting,setDeleting]=useState<EventPhoto|null>(null), [busy,setBusy]=useState(false), [success,setSuccess]=useState("");
  const [index,setIndex]=useState(0), [loadMore,setLoadMore]=useState(false);
  const [playing,setPlaying]=useState(true), [hovered,setHovered]=useState(false), [focused,setFocused]=useState(false);
  const touchX=useRef<number|null>(null), generation=useRef(0);
  const load=useCallback(async(signal?:AbortSignal)=>{
    const request=++generation.current;setLoading(true);setError("");setPhotos([]);setCursor(null);setIndex(0);
    try {
      const params=new URLSearchParams({month,...(manage?{manage:"true"}:{}),...(carousel?{preview:"true"}:{})});
      const response=await fetch(`/api/events?${params}`,{signal,cache:"no-store"});const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Kegiatan belum dapat dimuat.");
      if(!signal?.aborted&&request===generation.current){setPhotos(data.photos);setCursor(data.nextPageToken);}
    }catch(error){if(!signal?.aborted&&request===generation.current)setError(error instanceof Error?error.message:"Kegiatan belum dapat dimuat.");}
    finally{if(!signal?.aborted&&request===generation.current)setLoading(false);}
  },[month,manage,carousel]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return ()=>controller.abort();},[load]);
  useEffect(()=>{
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{if(preference.matches)setPlaying(false);};
    update();preference.addEventListener("change",update);return ()=>preference.removeEventListener("change",update);
  },[]);
  useEffect(()=>{
    if(!carousel||!playing||hovered||focused||preview||photos.length<2)return;
    const timer=window.setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%photos.length);},10000);
    return ()=>window.clearInterval(timer);
  },[carousel,playing,hovered,focused,preview,photos.length,index]);
  async function more(){
    if(!cursor||loadMore)return;const request=generation.current;setLoadMore(true);setError("");
    try{const params=new URLSearchParams({month,cursor,...(manage?{manage:"true"}:{})});const response=await fetch(`/api/events?${params}`);const data=await response.json();if(!response.ok)throw new Error(data.error);if(request===generation.current){setPhotos(current=>[...current,...data.photos.filter((p:EventPhoto)=>!current.some(old=>old.id===p.id))]);setCursor(data.nextPageToken);}}
    catch(error){if(request===generation.current)setError(error instanceof Error?error.message:"Foto belum dapat dimuat.");}finally{setLoadMore(false);}
  }
  function saved(target:string){setEditor(null);setSuccess("Foto kegiatan berhasil disimpan.");if(target!==month)setMonth(target);else void load();}
  async function remove(){
    if(!deleting)return;setBusy(true);setError("");
    try{const response=await fetch(`/api/events/${deleting.id}`,{method:"DELETE"});const data=await response.json();if(!response.ok)throw new Error(data.error);setDeleting(null);setSuccess("Foto dihapus dan dipindahkan ke sampah Google Drive.");void load();}
    catch(error){setError(error instanceof Error?error.message:"Foto belum dapat dihapus.");}finally{setBusy(false);}
  }
  const current=photos[index];
  function step(direction:number){setIndex(i=>(i+direction+photos.length)%photos.length);}
  if(carousel&&!loading&&!error&&!photos.length)return null;
  const contents=<>
    {!carousel&&<Box sx={{display:"flex",gap:2,alignItems:"center",flexWrap:"wrap",mb:4}}><TextField label={t("Bulan kegiatan")} type="month" value={month} onChange={e=>{if(e.target.value)setMonth(e.target.value);}} disabled={busy||loadMore} slotProps={{inputLabel:{shrink:true}}}/>{manage&&<Button startIcon={<AddPhotoAlternateOutlined/>} variant="contained" onClick={()=>setEditor("new")}>Tambah Foto Kegiatan</Button>}</Box>}
    {success&&<Alert severity="success" onClose={()=>setSuccess("")} sx={{mb:3}}>{success}</Alert>}
    {error&&<Alert severity="error" sx={{mb:3}} action={<Button onClick={()=>void load()}><T text="Coba Lagi" /></Button>}>{t(error)}</Alert>}
    {loading?<Box sx={{py:5,textAlign:"center"}}><CircularProgress aria-label={t("Memuat kegiatan jemaat")}/></Box>:carousel&&current?<>
      <div className="event-slide" role="region" aria-roledescription="carousel" aria-label={`Kegiatan ${monthLabel(month,language==="en"?"en-GB":"id-ID")}`} tabIndex={0}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocus={()=>setFocused(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}
        onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==="ArrowLeft"){e.preventDefault();step(-1);}if(e.key==="ArrowRight"){e.preventDefault();step(1);}}}
        onTouchStart={e=>{touchX.current=e.changedTouches[0].clientX;}} onTouchEnd={e=>{if(touchX.current!==null){const delta=e.changedTouches[0].clientX-touchX.current;if(Math.abs(delta)>60)step(delta<0?1:-1);}touchX.current=null;}}>
        <div className="event-image-stage">
          <button className="event-photo-button" onClick={()=>setPreview(current)} aria-label={`Perbesar foto: ${current.title}`}><PhotoImage key={current.id} photo={current}/></button>
          {photos.length>1&&<><button type="button" className="event-arrow event-arrow-left" onClick={()=>step(-1)} aria-label={t("Foto sebelumnya")}><ArrowBackIosNewRounded/></button><button type="button" className="event-arrow event-arrow-right" onClick={()=>step(1)} aria-label={t("Foto berikutnya")}><ArrowForwardIosRounded/></button></>}
        </div>
        <div className="event-slide-caption" aria-live={playing?"off":"polite"} aria-atomic="true"><p className="eyebrow">{dateLabel(current.eventDate,language)}</p><h3>{current.title}</h3>{current.caption&&<p>{current.caption}</p>}</div>
      </div>
      {photos.length>1&&<div className="event-playback"><Button startIcon={playing?<PauseCircleOutline/>:<PlayCircleOutline/>} onClick={()=>setPlaying(value=>!value)} aria-pressed={!playing}>{t(playing?"Jeda slideshow":"Putar slideshow")}</Button></div>}
    </>:!photos.length&&!error?<Typography color="text.secondary" sx={{py:4,borderTop:"1px solid var(--site-border)"}}><T text="Belum ada foto kegiatan untuk" />{monthLabel(month,language==="en"?"en-GB":"id-ID")}.</Typography>:<div className="event-archive-grid">{photos.map(photo=><article key={photo.id}>
      <button className="event-photo-button" onClick={()=>setPreview(photo)} aria-label={`Perbesar foto: ${photo.title}`}><PhotoImage photo={photo}/></button>
      <p className="eyebrow">{dateLabel(photo.eventDate,language)}{manage?` · ${photo.published?"Terbit":"Draf"}`:""}</p><h2>{photo.title}</h2>{photo.caption&&<p className="event-caption-text">{photo.caption}</p>}
      {manage&&<Box sx={{display:"flex",gap:1,flexWrap:"wrap",mt:2}}><Button variant="outlined" onClick={()=>setEditor(photo)}>Edit</Button><Button color="error" onClick={()=>{setError("");setDeleting(photo);}}>Hapus</Button></Box>}
    </article>)}</div>}
    {!carousel&&cursor&&<Button sx={{mt:4}} variant="outlined" disabled={loadMore} onClick={()=>void more()}>{t(loadMore?"Memuat…":"Muat Foto Lainnya")}</Button>}
    {manage&&editor&&<EventEditor photo={editor==="new"?undefined:editor} onClose={()=>{setEditor(null);void load();}} onSaved={saved}/>}
    <Dialog open={Boolean(preview)} onClose={()=>setPreview(null)} fullWidth maxWidth="md" aria-labelledby="event-preview-title"><DialogTitle id="event-preview-title">{preview?.title}</DialogTitle><DialogContent>{preview&&<><PhotoImage key={preview.id} photo={preview} large/><Typography color="text.secondary" sx={{mt:2}}>{dateLabel(preview.eventDate,language)}</Typography><Typography sx={{mt:1,whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{preview.caption}</Typography></>}</DialogContent><DialogActions><Button onClick={()=>setPreview(null)}><T text="Tutup" /></Button></DialogActions></Dialog>
    {manage&&<Dialog open={Boolean(deleting)} onClose={busy?undefined:()=>setDeleting(null)} aria-labelledby="event-delete-title"><DialogTitle id="event-delete-title">Hapus Foto Kegiatan?</DialogTitle><DialogContent><Typography>{deleting?.title}</Typography><Typography sx={{mt:2}}>Foto akan hilang dari website dan dipindahkan ke sampah Google Drive.</Typography>{error&&<Alert severity="error" sx={{mt:2}}>{error}</Alert>}</DialogContent><DialogActions><Button disabled={busy} onClick={()=>setDeleting(null)}><T text="Batal" /></Button><Button color="error" variant="contained" disabled={busy} onClick={()=>void remove()}>{busy?"Menghapus…":"Hapus Foto"}</Button></DialogActions></Dialog>}
  </>;
  return carousel?<section className="site-width section-space" aria-labelledby="events-title"><div className="section-heading"><div><p className="eyebrow"><T text="CERITA KELUARGA GEREJA ·" />{monthLabel(month,language==="en"?"en-GB":"id-ID")}</p><h2 id="events-title" className="section-title"><T text="Kegiatan Jemaat" /></h2></div><Link href="/kegiatan" className="text-link"><T text="Lihat Semua Kegiatan →" /></Link></div>{contents}</section>:contents;
}
