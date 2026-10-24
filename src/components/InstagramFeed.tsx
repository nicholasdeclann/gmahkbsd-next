import Instagram from "@mui/icons-material/Instagram";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { churchConfig } from "@/config/church";
import { T } from "@/components/LanguageProvider";

export default function InstagramFeed() {
  const profile = new URL(churchConfig.instagram.url);
  profile.pathname = `${profile.pathname.replace(/\/$/, "")}/embed/`;
  return (
    <section className="site-width section-space instagram-section" aria-labelledby="instagram-title">
      <div className="instagram-introduction">
        <p className="instagram-handle">{churchConfig.instagram.handle}</p>
        <h2 className="section-title" id="instagram-title">
          <T text="Cerita kebersamaan kita." />
        </h2>
        <p className="section-description">
          <T text="Ikuti kabar, kegiatan, dan momen keluarga jemaat melalui Instagram GMAHK BSD." />
        </p>
        <a
          className="text-link"
          href={churchConfig.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram aria-hidden="true" />
          <T text="Lihat di Instagram" />
          <ArrowForward aria-hidden="true" />
        </a>
      </div>
      <div className="instagram-embed-panel">
        <iframe
          src={profile.toString()}
          title={`Postingan Instagram ${churchConfig.instagram.handle}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; fullscreen"
          allowFullScreen
        />
        <p className="instagram-fallback">
          <T text="Postingan tidak muncul?" />{" "}
          <a href={churchConfig.instagram.url} target="_blank" rel="noopener noreferrer">
            <T text="Buka Instagram" />
          </a>
        </p>
      </div>
    </section>
  );
}
