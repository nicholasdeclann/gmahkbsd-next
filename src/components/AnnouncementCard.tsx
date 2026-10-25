"use client";
import AnnouncementShare from "./AnnouncementShare";
import {useLanguage} from "./LanguageProvider";
import {daysUntil,type AnnouncementItem} from "@/lib/announcementTypes";
import FilledImage from "./ui/glass/FilledImage";
import {GlassChip,GlassIconButton} from "./ui/glass/GlassControls";
import {EditOutlined,DeleteOutlined} from "./ui/icons";
export default function AnnouncementCard({post,onOpen,onEdit,onDelete}:{post:AnnouncementItem;onOpen:()=>void;onEdit?:()=>void;onDelete?:()=>void}){
 const {t,language}=useLanguage();const soon=post.due_date?daysUntil(post.due_date):null;
 const due=post.due_date?new Intl.DateTimeFormat(language==="en"?"en-GB":"id-ID",{day:"numeric",month:"short",timeZone:"Asia/Jakarta"}).format(new Date(post.due_date+"T12:00:00+07:00")):null;
 const dueText=post.expired?t("Kedaluwarsa"):soon===0?t("Berakhir hari ini"):soon===1?t("Berakhir besok"):due?t("Sampai")+" "+due:t("Tanpa tanggal");
 return <article id={"pengumuman-"+post.id} className={`announcement-card${post.expired?" is-expired":""}`}>
  <button className="announcement-poster" onClick={onOpen} aria-label={t("Lihat Gambar")+": "+post.title}>
   <FilledImage src={post.image_url} alt={post.title} adaptive ratio={post.width&&post.height?post.width/post.height:undefined} sizes="(max-width:600px) 100vw,(max-width:900px) 50vw,33vw"/>
  </button>
  <div className="announcement-caption glass-thin"><GlassChip>{post.department}</GlassChip><button className="announcement-title" onClick={onOpen}>{post.title}</button><GlassChip tone={soon!==null&&soon<=1&&!post.expired?"warn":"neutral"}>{dueText}</GlassChip></div>
  {onEdit&&<div className="announcement-actions"><GlassIconButton onClick={onEdit} aria-label={t("Edit")+": "+post.title}><EditOutlined/></GlassIconButton><AnnouncementShare iconOnly id={post.id} caption={post.title}/>{onDelete&&<GlassIconButton onClick={onDelete} aria-label={t("Hapus")+": "+post.title}><DeleteOutlined/></GlassIconButton>}</div>}
  {onEdit&&(!post.due_date||post.expired)&&!/^\d+$/.test(post.id)&&<button className="announcement-date-action" onClick={onEdit}>{t(post.expired?"Aktifkan lagi":"Atur tanggal")}</button>}
 </article>;
}