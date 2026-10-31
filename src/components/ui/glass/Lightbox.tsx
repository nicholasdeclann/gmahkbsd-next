"use client";
import { useLanguage } from "../../LanguageProvider";
import { useState, type ReactNode } from "react";
import { GlassButton } from "./GlassControls";
import FilledImage from "./FilledImage";
import GlassDialog from "./GlassDialog";
export default function Lightbox({open,onClose,src,title,caption,actions,zoomable=false}:{open:boolean;onClose:()=>void;src:string;title:string;caption?:ReactNode;actions?:ReactNode;zoomable?:boolean}) {
 const {t}=useLanguage();
 const [zoom,setZoom]=useState(1);
 const [size,setSize]=useState<{src:string;ratio:number}|null>(null);
 const ratio=size?.src===src?size.ratio:3/4;
 return <GlassDialog open={open} onClose={()=>{setZoom(1);onClose();}} title={title} size="lg" variant="media" className={zoomable?"glass-dialog--zoomable":""} actions={actions}>
  {zoomable ? <><div className="glass-lightbox-zoom-controls"><GlassButton onClick={()=>setZoom(value=>Math.min(4,value+1))} aria-disabled={zoom===4}>{"+ "}{t("Perbesar")}</GlassButton><GlassButton onClick={()=>setZoom(1)}>{t("Ukuran Awal")}</GlassButton></div><div className="glass-lightbox-zoom" tabIndex={0} role="region" aria-label={t("Poster yang dapat diperbesar")}><img src={src} alt={title} style={{width:`${zoom*100}%`}} /></div></> : <div className="glass-lightbox-image" style={{width:`min(100%, calc(72dvh * ${ratio}))`,aspectRatio:String(ratio)}}>
   {open&&<FilledImage src={src} alt={title} adaptive ratio={ratio} sizes="(max-width:600px) 100vw, 960px" onNaturalRatio={ratio=>setSize({src,ratio})}/>}
  </div>}<div className="glass-lightbox-caption"><h3>{title}</h3>{caption}</div>
 </GlassDialog>;
}
