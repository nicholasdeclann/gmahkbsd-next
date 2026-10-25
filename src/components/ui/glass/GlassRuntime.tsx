"use client";
import { useEffect } from "react";

/**
 * Edge-refraction displacement map: neutral grey in the middle (no displacement), pushing
 * pixels inward along each rim, which is what makes the rim of liquid glass bend what is behind it.
 * R drives horizontal and G vertical displacement.
 */
const MAP = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'>
<defs>
<linearGradient id='l' x1='0' x2='1'><stop offset='0' stop-color='rgb(255,128,128)'/><stop offset='1' stop-color='rgb(128,128,128)'/></linearGradient>
<linearGradient id='r' x1='0' x2='1'><stop offset='0' stop-color='rgb(128,128,128)'/><stop offset='1' stop-color='rgb(0,128,128)'/></linearGradient>
<linearGradient id='t' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='rgb(128,255,128)'/><stop offset='1' stop-color='rgb(128,128,128)'/></linearGradient>
<linearGradient id='b' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='rgb(128,128,128)'/><stop offset='1' stop-color='rgb(128,0,128)'/></linearGradient>
</defs>
<rect width='256' height='256' fill='rgb(128,128,128)'/>
<rect width='40' height='256' fill='url(#l)'/>
<rect x='216' width='40' height='256' fill='url(#r)'/>
<rect width='256' height='40' fill='url(#t)' opacity='.9'/>
<rect y='216' width='256' height='40' fill='url(#b)' opacity='.9'/>
</svg>`;
const MAP_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MAP)}`;

/**
 * Renders the shared SVG filter once and decides whether refraction is safe to switch on.
 * `html.glass-refract` is only set on Chromium, on devices that are not low-memory, and when the user
 * has not asked for reduced transparency or more contrast. Everything else gets the plain frosted glass.
 */
export default function GlassRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { brands?: { brand: string }[] } };
    const chromium = nav.userAgentData?.brands?.some(b => /Chromium/i.test(b.brand)) ?? /Chrome\//.test(nav.userAgent);
    const capable = chromium && (nav.deviceMemory === undefined || nav.deviceMemory >= 4);
    const less = window.matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)");
    const apply = () => root.classList.toggle("glass-refract", capable && !less.matches);
    apply();
    less.addEventListener("change", apply);
    return () => { less.removeEventListener("change", apply); root.classList.remove("glass-refract"); };
  }, []);
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", pointerEvents: "none" }}>
      <filter id="glass-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={MAP_URI} preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="22" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
