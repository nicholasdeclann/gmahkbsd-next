"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowForward, LocationOnOutlined } from "@/components/ui/icons";
import { T } from "@/components/LanguageProvider";
import { imageAsset } from "@/lib/asset";

const HERO_SLIDES = [
  {
    src: "church-hero.jpg",
    alt: "Atap gereja GMAHK BSD dan salib di bawah langit biru",
  },
  {
    src: "church/pulpit-emblem.jpg",
    alt: "Mimbar GMAHK BSD dengan logo Gereja Masehi Advent Hari Ketujuh",
  },
  {
    src: "church/flowers-flags.jpg",
    alt: "Bunga mimbar dan bendera pelayanan di ruang ibadah GMAHK BSD",
  },
  {
    src: "church/worship-piano.jpg",
    alt: "Pelayanan musik piano di ruang ibadah GMAHK BSD",
  },
];

export default function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="home-photo">
      <div className="hero-slides" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`hero-slide${index === activeIndex ? " is-active" : ""}`}
          >
            <Image
              src={imageAsset(slide.src)}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      <div className="image-hero-copy">
        <p className="hero-church-name">GMAHK BUMI SERPONG DAMAI</p>
        <h1 className="hero-title">
          <T text="Bersama dalam iman." />
          <br />
          <T text="Bertumbuh dalam kasih." />
        </h1>
        <p className="hero-subtitle">
          <T text="Selamat datang di keluarga GMAHK BSD." />
        </p>
        <div className="button-row">
          <Link className="site-button hero-button" href="/kertas-acara">
            <T text="Kertas Acara" />
            <ArrowForward />
          </Link>
          <a className="site-button hero-outline-button" href="#kunjungi">
            <LocationOnOutlined />
            <T text="Kunjungi Kami" />
          </a>
        </div>
      </div>

      <div className="hero-slide-dots" role="tablist" aria-label="Pilih foto beranda">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Foto ${index + 1}: ${slide.alt}`}
            className={`hero-slide-dot${index === activeIndex ? " is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
