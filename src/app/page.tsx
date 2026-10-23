import { CalendarMonthOutlined, CakeOutlined, ArrowForward, LocationOnOutlined, Instagram, WhatsApp } from "@/components/ui/icons";
import { T } from "@/components/LanguageProvider";
import Image from "next/image";
import Link from "next/link";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import PrayerListCard from "@/components/PrayerListCard";
import PhotoGallery from "@/components/PhotoGallery";
import EventPhotos from "@/components/events/EventPhotos";
import SabbathThisWeek from "@/components/SabbathThisWeek";

export default function Home() {
  return <>
    <div className="home-opening">
      <div className="home-photo">
        <Image src={imageAsset("church-hero.jpg")} alt="Atap gereja dan salib di bawah langit biru" fill priority sizes="100vw" />
        <div className="image-hero-copy">
          <p className="hero-church-name">GMAHK BUMI SERPONG DAMAI</p>
          <p className="hero-title"><T text="Bersama dalam iman." /><br /><T text="Bertumbuh dalam kasih." /></p>
          <p><T text="Selamat datang di keluarga GMAHK BSD." /></p>
          <div className="button-row"><Link className="site-button hero-button" href="/kertas-acara"><T text="Kertas Acara" /><ArrowForward /></Link><a className="hero-location" href="#kunjungi"><T text="Kunjungi Kami" /><LocationOnOutlined /></a></div>
        </div>
      </div>
      <SabbathThisWeek />
    </div>
    <section className="site-width section-space news-section" aria-labelledby="news-title">
      <div className="section-heading"><h2 className="section-title" id="news-title"><T text="Pengumuman" /></h2><Link className="text-link" href="/pengumuman"><T text="Lihat Semua" /><ArrowForward /></Link></div>
      <PhotoGallery previewLimit={2} />
    </section>
    <EventPhotos carousel />
    <section className="section-space worship-section" aria-labelledby="worship-title">
      <div className="site-width worship-grid">
        <div><h2 id="worship-title" className="section-title"><T text="Ibadah Bersama" /></h2><p className="section-description"><T text="Di gereja atau melalui Zoom." /></p>
          <a className="text-link" href="#kunjungi"><LocationOnOutlined /><T text="Lokasi Gereja" /></a>
        </div>
        <div className="worship-details">
          {churchConfig.services.map(service => <div className="service-row" key={service.name}><h3><T text={service.name} /><small><T text={service.day} /></small></h3><strong>{service.time}</strong></div>)}
          <div className="zoom-row"><div><strong><T text="Ibadah melalui Zoom" /></strong><p>Meeting ID: {churchConfig.zoom.id}<br /><T text="Kata sandi:" /> {churchConfig.zoom.password}</p></div><a className="site-button primary" href={churchConfig.zoom.url} target="_blank" rel="noopener noreferrer"><T text="Gabung Zoom" /><ArrowForward /></a></div>
        </div>
      </div>
    </section>
    <section id="kunjungi" className="site-width section-space visit-grid" aria-labelledby="visit-title">
      <div><h2 className="section-title" id="visit-title"><T text="Kunjungi Kami" /></h2><address className="church-address">{churchConfig.address}</address>
        <a className="site-button primary" href="https://www.google.com/maps/search/?api=1&query=GMAHK+Bumi+Serpong+Damai" target="_blank" rel="noopener noreferrer"><LocationOnOutlined /><T text="Buka Google Maps" /></a>
        <a className="instagram-link" href={churchConfig.instagram.url} target="_blank" rel="noopener noreferrer"><Instagram />{churchConfig.instagram.handle}<ArrowForward /></a>
      </div>
      <div className="map-panel"><iframe title="Lokasi GMAHK Bumi Serpong Damai di Google Maps" src={churchConfig.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </section>
    <section id="tentang" className="site-width section-space church-about" aria-labelledby="about-title">
      <div className="church-introduction"><h2 id="about-title" className="section-title"><T text="Tentang Gereja" /></h2><p><T text={churchConfig.about.introduction} /></p></div>
      <div className="mission-grid">
        <div><h3><T text="Visi GMAHK Bumi Serpong Damai" /></h3><p><T text={churchConfig.about.vision} /></p></div>
        <div><h3><T text="Misi GMAHK Bumi Serpong Damai" /></h3><p><T text={churchConfig.about.mission} /></p></div>
      </div>
    </section>
    <section className="site-width section-space pastor-welcome" aria-labelledby="pastor-title">
      <div className="pastor-small-photo"><Image src={imageAsset("pdt-eko-surono.png")} alt="Pdt. Eko Surono" width={773} height={1507} sizes="160px" /></div>
      <div><h2 id="pastor-title" className="section-title">Pdt. Eko Surono</h2><p className="section-description"><T text="Kami menyambut Anda untuk beribadah dan menjadi bagian dari keluarga jemaat GMAHK BSD." /></p><a className="text-link" href="https://wa.me/+62895337627700" target="_blank" rel="noopener noreferrer"><WhatsApp /><T text="Hubungi Pendeta" /></a></div>
    </section>
    <section className="community-section section-space" aria-labelledby="community-title">
      <div className="site-width community-heading"><h2 id="community-title" className="section-title"><T text="Pokok Doa" /></h2></div>
      <PrayerListCard showHeading={false} />
      <div className="site-width birthday-banner"><Link className="text-link" href="/ulang-tahun"><CakeOutlined /><T text="Ulang Tahun Minggu Ini" /><ArrowForward /></Link><Link className="text-link" href="/jadwal-pelayanan"><CalendarMonthOutlined /><T text="Jadwal Pelayanan" /><ArrowForward /></Link></div>
    </section>
  </>;
}
