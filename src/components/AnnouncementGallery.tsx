"use client";
import {useCallback,useEffect,useId,useRef,useState} from "react";
import {Alert} from "@mui/material";
import {type AnnouncementItem,deriveAnnouncement,compareAnnouncements,todayJakarta,addDays} from "@/lib/announcementTypes";
import {useLanguage} from "./LanguageProvider";
import AnnouncementCard from "./AnnouncementCard";
import AnnouncementFormDialog from "./AnnouncementFormDialog";
import AnnouncementShare from "./AnnouncementShare";
import Lightbox from "./ui/glass/Lightbox";
import ConfirmDialog from "./ui/glass/ConfirmDialog";
import {GlassButton,GlassSegmented} from "./ui/glass/GlassControls";
import {AddPhotoAlternateOutlined,OpenInNew} from "./ui/icons";
export default function AnnouncementGallery({editable=false,previewLimit}:{editable?:boolean;previewLimit?:number}){
 const panelId=useId();const {t}=useLanguage();const [posts,setPosts]=useState<AnnouncementItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[success,setSuccess]=useState(""),[configured,setConfigured]=useState(true),[tab,setTab]=useState("active"),[editor,setEditor]=useState<AnnouncementItem|"new"|null>(null),[preview,setPreview]=useState<AnnouncementItem|null>(null),[deleting,setDeleting]=useState<AnnouncementItem|null>(null),[busy,setBusy]=useState(false),[deleteError,setDeleteError]=useState(""),[missing,setMissing]=useState(false);
 const generation=useRef(0),openedDeepLink=useRef(false);
 const load=useCallback(async(signal?:AbortSignal,quiet=false)=>{const request=++generation.current;if(!quiet)setLoading(true);setError("");
  try{const response=await fetch("/api/photos"+(editable?"?manage=true":""),{cache:"no-store",signal});const data=await response.json();if(!response.ok)throw new Error(data.error||t("Pengumuman belum dapat dimuat. Silakan coba lagi."));
   if(signal?.aborted||request!==generation.current)return;
   const list=(data.photos as AnnouncementItem[]).map(p=>deriveAnnouncement(p)).sort(compareAnnouncements);setPosts(list);setConfigured(data.configured);
   setPreview(current=>current?list.find(p=>p.id===current.id)??null:null);
   if(!editable&&!previewLimit&&!openedDeepLink.current){const id=new URL(location.href).searchParams.get("post");if(id){const post=list.find(p=>p.id===id);setPreview(post??null);setMissing(!post);}openedDeepLink.current=true;}
  }catch(e){if(!signal?.aborted&&request===generation.current)setError(e instanceof Error?e.message:t("Pengumuman belum dapat dimuat. Silakan coba lagi."));}finally{if(!signal?.aborted&&request===generation.current)setLoading(false);}
 },[editable,previewLimit,t]);
 useEffect(()=>{const c=new AbortController();void load(c.signal);return()=>c.abort();},[load]);
 useEffect(()=>{const c=new AbortController();let day=todayJakarta();const check=()=>{if(document.hidden)return;const next=todayJakarta();if(next!==day){day=next;setPosts(current=>current.map(p=>deriveAnnouncement(p)));setPreview(current=>current&&deriveAnnouncement(current).expired&&!editable?null:current);}void load(c.signal,true);};const timer=setInterval(check,60000);let boundary:ReturnType<typeof setTimeout>;function midnight(){boundary=setTimeout(()=>{check();midnight();},Math.max(1,Date.parse(addDays(todayJakarta(),1)+"T00:00:00+07:00")-Date.now()+30));}midnight();window.addEventListener("focus",check);document.addEventListener("visibilitychange",check);return()=>{c.abort();clearInterval(timer);clearTimeout(boundary);window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",check);};},[load,editable]);
 function saved(post:AnnouncementItem){generation.current++;setPosts(current=>[...current.filter(p=>p.id!==post.id),deriveAnnouncement(post)].sort(compareAnnouncements));setEditor(null);setSuccess(t("Pengumuman berhasil disimpan."));void load(undefined,true);}
 async function remove(){if(!deleting||busy)return;setBusy(true);setDeleteError("");try{const res=await fetch("/api/photos/"+encodeURIComponent(deleting.id),{method:"DELETE"});const data=await res.json();if(!res.ok)throw new Error(data.error);generation.current++;setPosts(current=>current.filter(p=>p.id!==deleting.id));setDeleting(null);setSuccess(t("Pengumuman telah dihapus. Gambar dipindahkan ke sampah Google Drive."));}catch(e){setDeleteError(e instanceof Error?e.message:t("Pengumuman belum berhasil dihapus."));}finally{setBusy(false);}}
 const active=posts.filter(p=>!p.expired),expired=posts.filter(p=>p.expired),visible=editable&&tab==="expired"?expired:active;

 return <div className={editable?"announcement-board announcement-board--admin":"announcement-board"}>
  {!previewLimit&&<div className="announcement-toolbar">{editable?<><GlassSegmented panelId={panelId} label={t("Status pengumuman")} value={tab} onChange={setTab} options={[{value:"active",label:t("Aktif"),count:active.length},{value:"expired",label:t("Kedaluwarsa"),count:expired.length}]}/><div className="announcement-header-actions"><GlassButton tone="plain" href="/pengumuman" target="_blank" rel="noopener noreferrer" startIcon={<OpenInNew/>}>{t("Lihat di Website")}</GlassButton><GlassButton className="announcement-add" tone="primary" startIcon={<AddPhotoAlternateOutlined/>} onClick={()=>setEditor("new")}>{t("Tambah Pengumuman")}</GlassButton></div></>:<AnnouncementShare board/>}</div>}
  {editable&&active.some(p=>!p.due_date)&&<p className="announcement-undated">{active.filter(p=>!p.due_date).length} {t("pengumuman tanpa tanggal berakhir")}</p>}
  {editable&&!configured&&<Alert severity="info" action={<GlassButton href="/admin/settings/google" tone="plain">{t("Pengaturan")}</GlassButton>}>{t("Hubungkan folder pengumuman di Google Drive sebelum menerbitkan gambar.")}</Alert>}
  {error&&<Alert severity="error" action={<GlassButton onClick={()=>void load()} tone="plain">{t("Coba Lagi")}</GlassButton>}>{error}</Alert>}
  {success&&<Alert severity="success" role="status" onClose={()=>setSuccess("")}>{success}</Alert>}
  {missing&&<Alert severity="info">{t("Pengumuman ini sudah berakhir atau belum tersedia.")}</Alert>}
  <div role={editable?"tabpanel":undefined} id={panelId} aria-labelledby={editable?panelId+"-"+tab:undefined}>
  {loading?<div className="announcement-masonry" aria-busy="true" aria-label={t("Memuat pengumuman")} >{[1,2].map(i=><div key={i} className="announcement-skeleton"/>)}</div>:<>
   {!visible.length&&!error&&<div className="announcement-empty"><p>{t(tab==="expired"?"Belum ada pengumuman kedaluwarsa.":"Belum ada pengumuman tambahan.")}</p>{editable&&<GlassButton tone="plain" onClick={()=>setEditor("new")}>{t("Tambah Pengumuman")}</GlassButton>}</div>}
   <div className={`announcement-masonry${previewLimit?" announcement-masonry--preview":""}`}>{(previewLimit?visible.slice(0,previewLimit):visible).map(post=><AnnouncementCard key={post.id} post={post} onOpen={()=>setPreview(post)} onEdit={editable?()=>setEditor(post):undefined} onDelete={editable&&!/^\d+$/.test(post.id)?()=>{setDeleteError("");setDeleting(post);}:undefined}/>)}</div>
  </>}
  </div>
  {editor&&<AnnouncementFormDialog key={editor==="new"?"new":editor.id} post={editor==="new"?undefined:editor} onClose={()=>setEditor(null)} onSaved={saved}/>}
  <ConfirmDialog open={Boolean(deleting)} onClose={()=>setDeleting(null)} onConfirm={()=>void remove()} title="Hapus Pengumuman?" subject={deleting?.title} message="Pengumuman akan hilang dari papan jemaat. File gambarnya dipindahkan ke sampah Google Drive dan dapat dipulihkan dari sana." confirmLabel="Hapus Pengumuman" busyLabel="Menghapus…" busy={busy} error={deleteError}/>
  {preview&&<Lightbox open onClose={()=>setPreview(null)} src={preview.image_url} title={preview.title} caption={<><p>{preview.department}</p><p className="announcement-full-caption">{preview.caption}</p></>} actions={<AnnouncementShare id={preview.id} caption={preview.title}/>}/>}
 </div>;
}
