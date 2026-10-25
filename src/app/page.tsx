import {
  CalendarMonthOutlined,
  CakeOutlined,
  ArrowForward,
  LocationOnOutlined,
  Instagram,
  WhatsApp,
} from "@/components/ui/icons";
import ShaderGradientBg from "@/components/ui/ShaderGradientBg";
import HeroSlideshow from "@/components/HeroSlideshow";
import { T } from "@/components/LanguageProvider";
import Image from "next/image";
import Link from "next/link";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";
import PrayerListCard from "@/components/PrayerListCard";
import AnnouncementGallery from "@/components/AnnouncementGallery";
import EventPhotos from "@/components/events/EventPhotos";
import SabbathThisWeek from "@/components/SabbathThisWeek";
import GivingSection from "@/components/GivingSection";

export default function Home() {
  return (
    <>
      <div className="home-opening">
        <HeroSlideshow />
        <SabbathThisWeek />
      </div>

      <section className="site-width section-space news-section" aria-labelledby="news-title">
        <div className="section-heading">
          <div>
            <p className="section-meta">
              <T text="KABAR KELUARGA GEREJA" />
            </p>
            <h2 className="section-title" id="news-title">
              <T text="Pengumuman" />
            </h2>
          </div>
          <Link className="text-link" href="/pengumuman">
            <T text="Lihat Semua" />
            <ArrowForward />
          </Link>
        </div>
        <AnnouncementGallery previewLimit={2} />
      </section>

      <div className="events-band">
        <EventPhotos carousel />
      </div>

      <section id="kunjungi" className="section-space worship-visit-section" aria-labelledby="worship-title">
        <div className="site-width worship-visit-split">
          <div className="map-panel">
            <iframe
              title="Lokasi GMAHK Bumi Serpong Damai di Google Maps"
              src={churchConfig.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="worship-visit-copy">
            <p className="section-meta">
              <T text="MARI BERIBADAH BERSAMA" />
            </p>
            <h2 id="worship-title" className="section-title">
              <T text="Ibadah Bersama & Lokasi" />
            </h2>
            <p className="section-description">
              <T text="Bergabunglah dalam ibadah di gereja atau secara daring melalui Zoom." />
            </p>
            <div className="worship-details">
              {churchConfig.services.map((service) => (
                <div className="service-row" key={service.name}>
                  <h3>
                    <T text={service.name} />
                    <small>
                      <T text={service.day} />
                    </small>
                  </h3>
                  <strong>{service.time}</strong>
                </div>
              ))}
              <div className="zoom-row">
                <div>
                  <strong>
                    <T text="Ibadah melalui Zoom" />
                  </strong>
                  <p>
                    Meeting ID: {churchConfig.zoom.id} · <T text="Kata sandi:" /> {churchConfig.zoom.password}
                  </p>
                </div>
                <a
                  className="site-button primary"
                  href={churchConfig.zoom.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <T text="Gabung Zoom" />
                  <ArrowForward />
                </a>
              </div>
            </div>
            <address className="church-address">{churchConfig.address}</address>
            <div className="button-row">
              <a
                className="site-button secondary"
                href="https://www.google.com/maps/search/?api=1&query=GMAHK+Bumi+Serpong+Damai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LocationOnOutlined />
                <T text="Buka Google Maps" />
              </a>
              <a
                className="instagram-link"
                href={churchConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram />
                {churchConfig.instagram.handle}
                <ArrowForward />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="gms-about-banner" aria-labelledby="about-title">
        <div className="gms-about-bg" aria-hidden="true">
          <Image
            src={imageAsset("church/pulpit-emblem.jpg")}
            alt=""
            fill
            sizes="100vw"
          />
        </div>
        <div className="site-width gms-about-inner">
          <p className="section-meta">
            <T text="PERSEKUTUAN · PELAYANAN · PENGINJILAN" />
          </p>
          <h2 id="about-title" className="gms-about-title">
            GMAHK BSD
          </h2>
          <p className="gms-about-lead">
            <T text={churchConfig.about.introduction} />
          </p>
        </div>
      </section>

      <section className="section-space gms-vision-section" aria-label="Visi dan Misi">
        <div className="site-width gms-vision-grid">
          <div className="gms-vision-col">
            <div className="gms-vision-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="3.5" strokeOpacity="0.22" />
                <path
                  d="M8 32C14.5 20 22.5 15 32 15C41.5 15 49.5 20 56 32C49.5 44 41.5 49 32 49C22.5 49 14.5 44 8 32Z"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="32" r="8" fill="currentColor" />
              </svg>
            </div>
            <h3 className="gms-vision-heading">
              <T text="VISI" />
            </h3>
            <p className="gms-vision-statement">
              <T text={churchConfig.about.vision} />
            </p>
          </div>
          <div className="gms-vision-col">
            <div className="gms-vision-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3.5" />
                <ellipse cx="32" cy="32" rx="11" ry="24" stroke="currentColor" strokeWidth="3.5" />
                <path d="M9 25H55M9 39H55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M32 8V56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.35" />
              </svg>
            </div>
            <h3 className="gms-vision-heading">
              <T text="MISI" />
            </h3>
            <p className="gms-vision-statement">
              <T text={churchConfig.about.mission} />
            </p>
          </div>
        </div>
      </section>

      <section className="gms-pastor-band" aria-labelledby="pastor-title">
        <div className="site-width gms-pastor-inner">
          <div className="gms-pastor-cutout">
            <Image
              src={imageAsset("pdt-eko-surono.png")}
              alt="Pdt. Eko Surono"
              width={773}
              height={1507}
              sizes="(max-width: 900px) 200px, 240px"
            />
          </div>
          <div className="gms-pastor-copy">
            <p className="section-meta">
              <T text="PENDETA JEMAAT" />
            </p>
            <h2 id="pastor-title" className="gms-pastor-name">
              Pdt. Eko Surono
            </h2>
            <p className="gms-pastor-bio">
              <T text="Kami menyambut Anda untuk beribadah, bertumbuh dalam iman, dan menjadi bagian dari keluarga besar jemaat GMAHK Bumi Serpong Damai." />
            </p>
            <a
              className="site-button gms-pastor-btn"
              href="https://wa.me/+62895337627700"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsApp />
              <T text="Hubungi Pendeta" />
            </a>
          </div>
        </div>
      </section>

      <GivingSection />

      <ShaderGradientBg variant="community" className="community-shader-band">
        <section className="section-space community-section" aria-labelledby="community-title">
          <div className="site-width community-heading">
            <p className="section-meta">
              <T text="SALING MENGUATKAN" />
            </p>
            <h2 id="community-title" className="section-title">
              <T text="Pokok Doa & Komunitas" />
            </h2>
            <p className="section-description">
              <T text="Mari saling mendoakan dan menyampaikan perhatian kepada sesama jemaat." />
            </p>
          </div>
          <PrayerListCard showHeading={false} />
          <div className="site-width birthday-banner">
            <Link className="text-link" href="/ulang-tahun">
              <CakeOutlined />
              <T text="Ulang Tahun Minggu Ini" />
              <ArrowForward />
            </Link>
            <Link className="text-link" href="/jadwal-pelayanan">
              <CalendarMonthOutlined />
              <T text="Jadwal Pelayanan" />
              <ArrowForward />
            </Link>
          </div>
        </section>
      </ShaderGradientBg>
    </>
  );
}
