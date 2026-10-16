import { T } from "@/components/LanguageProvider";
import type { Metadata } from "next";
import { churchConfig } from "@/config/church";
import PhotoGallery from "@/components/PhotoGallery";

export const metadata: Metadata = {
  title: "Pengumuman Jemaat | GMAHK BSD",
  description: "Informasi, kegiatan, dan pengumuman dari seluruh departemen GMAHK BSD.",
  openGraph: { title: "Papan Pengumuman Jemaat — GMAHK BSD", description: "Informasi dan kegiatan dari seluruh departemen gereja.", type: "website" },
};

export default function Pengumuman() {
  return <div className="site-width">
    <header className="page-intro"><p className="eyebrow"><T text="KABAR KELUARGA GEREJA" /></p><h1><T text="Pengumuman Jemaat" /></h1><p><T text="Informasi ibadah, kegiatan, dan kabar terbaru dari seluruh departemen gereja." /></p></header>
    <section className="canva-section" aria-labelledby="weekly-announcements">
      <h2 id="weekly-announcements"><T text="Pengumuman Mingguan" /></h2>
      <div className="canva-frame"><iframe title="Pengumuman mingguan GMAHK BSD dari Canva" loading="lazy" src={churchConfig.pengumumanEmbedUrl} allowFullScreen allow="fullscreen" /></div>
      <a className="canva-open" href={churchConfig.pengumumanEmbedUrl.replace("?embed", "")} target="_blank" rel="noopener noreferrer"><T text="Buka pengumuman dalam tampilan penuh ↗" /></a>
    </section>
    <section className="section-space"><PhotoGallery /></section>
  </div>;
}
