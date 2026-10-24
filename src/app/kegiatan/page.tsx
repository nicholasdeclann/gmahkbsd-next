import { T } from "@/components/LanguageProvider";
import type { Metadata } from "next";
import EventPhotos from "@/components/events/EventPhotos";
import InstagramFeed from "@/components/InstagramFeed";

export const metadata: Metadata = { title: "Kegiatan Jemaat | GMAHK BSD" };

export default function EventsPage() {
  return (
    <>
      <section className="site-width page-intro">
        <h1 className="section-title">
          <T text="Kegiatan Jemaat" />
        </h1>
        <p className="section-description">
          <T text="Kenangan kebersamaan dan pelayanan jemaat. Pilih bulan untuk melihat foto kegiatan." />
        </p>
      </section>
      <section className="site-width section-space" style={{ paddingTop: 0 }}>
        <EventPhotos />
      </section>
      <InstagramFeed />
    </>
  );
}
