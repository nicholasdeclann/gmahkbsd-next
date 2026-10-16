import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CakeOutlined from "@mui/icons-material/CakeOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import { T } from "@/components/LanguageProvider";
import Image from "next/image";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import Instagram from "@mui/icons-material/Instagram";
import WhatsApp from "@mui/icons-material/WhatsApp";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import PrayerListCard from "@/components/PrayerListCard";
import PhotoGallery from "@/components/PhotoGallery";
import EventPhotos from "@/components/events/EventPhotos";
import SabbathThisWeek from "@/components/SabbathThisWeek";

export default function Home() {
  return <>
    <section className="image-hero" aria-labelledby="welcome-title">
      <Image className="hero-photo" src={imageAsset("church-hero.jpg")} alt="Atap gereja dan salib di bawah langit biru" fill priority sizes="100vw" />
      <div className="hero-shade" />
      <div className="image-hero-copy">
        <p className="eyebrow">GMAHK BUMI SERPONG DAMAI</p>
        <h1 id="welcome-title"><T text="Bersama dalam iman." /><br /><T text="Bertumbuh dalam kasih." /></h1>
        <p><T text="Selamat datang di keluarga GMAHK BSD." /></p>
        <div className="button-row"><Link className="site-button hero-button" href="/kertas-acara"><T text="Kertas Acara" /><ArrowForward /></Link><a className="hero-location" href="#kunjungi"><T text="Kunjungi Kami" /><LocationOnOutlined /></a></div>
      </div>
    </section>
    <SabbathThisWeek />
    <nav className="site-width simple-links" aria-label="Akses cepat">
      <Link href="/jadwal-pelayanan"><CalendarMonthOutlined/><h2><T text="Jadwal Pelayanan" /></h2><p><T text="Jadwal Pelayanan Triwulan" /></p><ArrowForward className="shortcut-arrow"/></Link>
      <Link href="/ulang-tahun"><CakeOutlined/><h2><T text="Ulang Tahun" /></h2><p><T text="Hari istimewa keluarga jemaat." /></p><ArrowForward className="shortcut-arrow"/></Link>
      <Link href="/kegiatan"><PhotoLibraryOutlined/><h2><T text="Kegiatan Jemaat" /></h2><p><T text="Foto dan cerita kebersamaan." /></p><ArrowForward className="shortcut-arrow"/></Link>
    </nav>
    <section className="site-width section-space news-section" aria-labelledby="news-title">
      <div className="section-heading"><div><p className="eyebrow"><T text="KABAR KELUARGA GEREJA" /></p><h2 className="section-title" id="news-title"><T text="Pengumuman Jemaat" /></h2></div><Link className="text-link" href="/pengumuman"><T text="Semua Pengumuman" /><ArrowForward /></Link></div>
      <PhotoGallery previewLimit={3} />
    </section>
    <EventPhotos carousel />
    <section className="section-space worship-section" aria-labelledby="worship-title">
      <div className="site-width worship-grid">
        <div><p className="eyebrow"><T text="MARI BERIBADAH BERSAMA" /></p><h2 id="worship-title" className="section-title"><T text="Waktu untuk" /><br /><T text="beribadah bersama." /></h2><p className="section-description"><T text="Bergabunglah dalam ibadah di gereja atau secara daring melalui Zoom." /></p></div>
        <div className="worship-details">
          {churchConfig.services.map(service => <div className="service-row" key={service.name}><h3><T text={service.name} /><small><T text={service.day} /></small></h3><strong>{service.time}</strong></div>)}
          <div className="zoom-row"><div><strong><T text="Ibadah melalui Zoom" /></strong><p>Meeting ID: {churchConfig.zoom.id}<br /><T text="Kata sandi:" />{churchConfig.zoom.password}</p></div><a className="site-button primary" href={churchConfig.zoom.url} target="_blank" rel="noopener noreferrer"><T text="Gabung Zoom" /><ArrowForward /></a></div>
        </div>
      </div>
    </section>
    <section className="site-width welcome-section">
      <p className="eyebrow"><T text="SELAMAT DATANG" /></p><h2 className="section-title"><T text="Ada tempat untuk Anda di sini." /></h2>
      <p><T text="Beribadah, bertumbuh dalam iman, dan melayani bersama." /><br /><T text="Kami senang menyambut Anda dan keluarga." /></p>
    </section>
    <section id="tentang" className="site-width section-space church-about" aria-labelledby="about-title">
      <div className="church-introduction">
        <p className="eyebrow"><T text="PERSEKUTUAN · PELAYANAN · PENGINJILAN" /></p>
        <h2 id="about-title" className="section-title"><T text="Mengenal GMAHK" /><br />Bumi Serpong Damai.</h2>
        <p><T text={churchConfig.about.introduction} /></p>
      </div>
      <div className="mission-grid">
        <div><h3><T text="Visi GMAHK Bumi Serpong Damai" /></h3><p><T text={churchConfig.about.vision} /></p></div>
        <div><h3><T text="Misi GMAHK Bumi Serpong Damai" /></h3><p><T text={churchConfig.about.mission} /></p></div>
      </div>
    </section>
    <section className="site-width section-space pastor-welcome" aria-labelledby="pastor-title">
      <div className="pastor-small-photo"><Image src={imageAsset("pdt-eko-surono.png")} alt="Pdt. Eko Surono" width={773} height={1507} sizes="220px" /></div>
      <div><p className="eyebrow"><T text="PENDETA JEMAAT" /></p><h2 id="pastor-title" className="section-title">Pdt. Eko Surono</h2><p className="section-description"><T text="Kami menyambut Anda untuk beribadah dan menjadi bagian dari keluarga jemaat GMAHK BSD." /></p><a className="text-link" href="https://wa.me/+62895337627700" target="_blank" rel="noopener noreferrer"><T text="Hubungi Pendeta" /><WhatsApp fontSize="small" /></a></div>
    </section>
    <section className="community-section section-space" aria-labelledby="community-title">
      <div className="site-width community-heading"><p className="eyebrow"><T text="SALING MENGUATKAN" /></p><h2 id="community-title" className="section-title"><T text="Satu keluarga dalam doa." /></h2><p className="section-description"><T text="Mari saling mendoakan dan menyampaikan perhatian kepada sesama jemaat." /></p></div>
      <PrayerListCard />
      <div className="site-width birthday-banner"><div><div><h3><T text="Siapa yang berulang tahun minggu ini?" /></h3><p><T text="Sampaikan ucapan dan doa untuk keluarga jemaat kita." /></p></div></div><Link className="text-link" href="/ulang-tahun"><T text="Lihat Ulang Tahun" /><ArrowForward /></Link></div>
    </section>
    <section id="kunjungi" className="site-width section-space visit-grid" aria-labelledby="visit-title">
      <div><p className="eyebrow"><T text="PINTU KAMI TERBUKA" /></p><h2 className="section-title" id="visit-title"><T text="Sampai jumpa" /><br /><T text="di gereja." /></h2><p className="section-description"><T text="Kami menantikan kehadiran Anda dan keluarga." /></p><address className="church-address">{churchConfig.address}</address><a className="site-button primary" href="https://www.google.com/maps/search/?api=1&query=GMAHK+Bumi+Serpong+Damai" target="_blank" rel="noopener noreferrer"><T text="Buka Google Maps" /><LocationOnOutlined /></a><a className="instagram-link" href={churchConfig.instagram.url} target="_blank" rel="noopener noreferrer"><Instagram /><T text="Ikuti" />{" "}{churchConfig.instagram.handle} <ArrowForward /></a></div>
      <div className="map-panel"><iframe title="Lokasi GMAHK Bumi Serpong Damai di Google Maps" src={churchConfig.mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </section>
  </>;
}
