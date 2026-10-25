"use client";
import { useState, type ReactNode } from "react";
import FilledImage from "./FilledImage";
import GlassDialog from "./GlassDialog";
export default function Lightbox({open,onClose,src,title,caption,actions}:{open:boolean;onClose:()=>void;src:string;title:string;caption?:ReactNode;actions?:ReactNode}) {
 const [size,setSize]=useState<{src:string;ratio:number}|null>(null);
 const ratio=size?.src===src?size.ratio:3/4;
 return <GlassDialog open={open} onClose={onClose} title={title} size="lg" variant="media" actions={actions}>
  <div className="glass-lightbox-image" style={{width:`min(100%, calc(72dvh * ${ratio}))`,aspectRatio:String(ratio)}}>
   {open&&<FilledImage src={src} alt={title} adaptive ratio={ratio} sizes="(max-width:600px) 100vw, 960px" onNaturalRatio={ratio=>setSize({src,ratio})}/>}
  </div><div className="glass-lightbox-caption"><h3>{title}</h3>{caption}</div>
 </GlassDialog>;
}
