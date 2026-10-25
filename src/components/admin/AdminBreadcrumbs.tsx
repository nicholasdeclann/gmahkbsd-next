"use client";
import Link from "next/link";
import {ArrowBack} from "../ui/icons";
import {GlassButton} from "../ui/glass/GlassControls";
import { usePathname } from "next/navigation";
const labels: Record<string,string> = { "kertas-acara":"Kertas Acara", prayer:"Pokok Doa", photos:"Pengumuman", events:"Kegiatan Jemaat", settings:"Pengaturan", spreadsheets:"Sumber Spreadsheet", google:"Koneksi Google" };
export default function AdminBreadcrumbs() {
  const pathname=usePathname();
  const segments=pathname.split("/").filter(Boolean);
  if(segments.length<2)return null;
  const parent="/"+segments.slice(0,-1).join("/"), parentLabel=segments.length===2?"Dashboard":labels[segments.at(-2)!]||"Dashboard";
  return <div className="admin-breadcrumb-row"><GlassButton component={Link} href={parent} startIcon={<ArrowBack/>}>{parentLabel}</GlassButton><nav aria-label="Breadcrumb" className="admin-breadcrumbs"><ol>{segments.map((segment,index)=>{
    const label=index===0?"Dashboard":labels[segment]||segment.replaceAll("-"," ");
    const href="/"+segments.slice(0,index+1).join("/");
    return <li key={href}>{index===segments.length-1?<span aria-current="page">{label}</span>:<Link href={href}>{label}</Link>}</li>;
  })}</ol></nav></div>;
}
