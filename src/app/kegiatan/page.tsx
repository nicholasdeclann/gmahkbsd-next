import { T } from "@/components/LanguageProvider";
import type { Metadata } from "next";
import EventPhotos from "@/components/events/EventPhotos";
export const metadata:Metadata={title:"Kegiatan Jemaat | GMAHK BSD"};
export default function EventsPage(){return <section className="site-width section-space"><p className="eyebrow"><T text="CERITA KELUARGA GEREJA" /></p><h1 className="section-title"><T text="Kegiatan Jemaat" /></h1><p className="section-description"><T text="Kenangan kebersamaan dan pelayanan jemaat. Pilih bulan untuk melihat foto kegiatan." /></p><EventPhotos/></section>;}
