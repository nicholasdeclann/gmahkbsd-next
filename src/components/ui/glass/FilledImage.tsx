"use client";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { T } from "../../LanguageProvider";

/**
 * Every photo on the site goes through this: the picture always fills its frame (object-fit: cover),
 * so there are never letterbox bars or colour-filled gaps. The tinted placeholder only shows while loading.
 *
 *  - `adaptive`: the frame takes the picture's own ratio (announcement posters), so it fills with no crop at all.
 *  - otherwise the parent decides the frame size (event photos) and the picture is cropped to fill it.
 */
export default function FilledImage(props: Parameters<typeof ImageFrame>[0]) {
  return <ImageFrame key={props.src} {...props} />;
}

function ImageFrame({
  src, alt, ratio, adaptive = false, sizes, priority, objectPosition = "50% 35%", className = "", style, onError, onNaturalRatio,
}: {
  src: string; alt: string; ratio?: number; adaptive?: boolean; sizes?: string; priority?: boolean;
  objectPosition?: string; className?: string; style?: CSSProperties; onError?: () => void;
  /** Reports the picture's own width/height once it has loaded. */
  onNaturalRatio?: (ratio: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [natural, setNatural] = useState<number | null>(null);
  const aspect = adaptive ? natural ?? ratio ?? 3 / 4 : ratio;
  return (
    <div className={`filled-image ${failed ? "is-failed" : loaded ? "is-loaded" : "is-loading"} ${className}`.trim()}
      style={{ ...(aspect ? { aspectRatio: String(aspect) } : {}), ...style }}>
      {failed ? <div className="filled-image__error" role="status"><T text="Foto belum dapat dimuat." /></div> : (
        <Image src={src} alt={alt} fill unoptimized priority={priority} sizes={sizes} style={{ objectFit: "cover", objectPosition }}
          onLoad={event => {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              const natural = img.naturalWidth / img.naturalHeight;
              if (adaptive) setNatural(natural);
              onNaturalRatio?.(natural);
            }
            setLoaded(true);
          }}
          onError={() => { setFailed(true); onError?.(); }} />
      )}
    </div>
  );
}
