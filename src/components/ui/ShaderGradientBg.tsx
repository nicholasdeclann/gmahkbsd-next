"use client";
import { useEffect, useState, type ReactNode } from "react";

export type ShaderPreset = "sabbath" | "community" | "birthday";

const PRESETS: Record<
  ShaderPreset,
  {
    color1: string;
    color2: string;
    color3: string;
    uSpeed: number;
    uStrength: number;
    uDensity: number;
    uFrequency: number;
    cDistance: number;
    cPolarAngle: number;
    cAzimuthAngle: number;
    brightness: number;
  }
> = {
  sabbath: {
    color1: "#17324d",
    color2: "#1555c0",
    color3: "#4a86e8",
    uSpeed: 0.14,
    uStrength: 1.1,
    uDensity: 0.9,
    uFrequency: 2.0,
    cDistance: 1.5,
    cPolarAngle: 90,
    cAzimuthAngle: 0,
    brightness: 1.65,
  },
  community: {
    color1: "#17324d",
    color2: "#1555c0",
    color3: "#3d7be0",
    uSpeed: 0.13,
    uStrength: 1.0,
    uDensity: 0.85,
    uFrequency: 1.9,
    cDistance: 1.5,
    cPolarAngle: 92,
    cAzimuthAngle: 10,
    brightness: 1.65,
  },
  birthday: {
    color1: "#f8c5d8",
    color2: "#f9df9e",
    color3: "#96e2dc",
    uSpeed: 0.15,
    uStrength: 1.1,
    uDensity: 0.9,
    uFrequency: 2.0,
    cDistance: 1.45,
    cPolarAngle: 90,
    cAzimuthAngle: 0,
    brightness: 1.7,
  },
};

type SGModule = typeof import("@shadergradient/react");

export default function ShaderGradientBg({
  variant = "sabbath",
  className = "",
  children,
}: {
  variant?: ShaderPreset;
  className?: string;
  children: ReactNode;
}) {
  const [sg, setSg] = useState<SGModule | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener("change", onChange);

    let cancelled = false;
    import("@shadergradient/react")
      .then((mod) => {
        if (!cancelled) setSg(mod);
      })
      .catch(() => {
        // Fallback to CSS gradient if WebGL or dynamic chunk is unavailable
      });

    return () => {
      cancelled = true;
      media.removeEventListener("change", onChange);
    };
  }, []);

  const preset = PRESETS[variant];
  const CanvasComp = sg?.ShaderGradientCanvas;
  const GradientComp = sg?.ShaderGradient;

  return (
    <div className={`shader-band shader-band--${variant}${className ? ` ${className}` : ""}`}>
      <div className="shader-band__canvas" aria-hidden="true">
        {CanvasComp && GradientComp && (
          <CanvasComp
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            pixelDensity={1.25}
            fov={38}
            pointerEvents="none"
          >
            <GradientComp
              type="waterPlane"
              animate={reducedMotion ? "off" : "on"}
              uSpeed={preset.uSpeed}
              uStrength={preset.uStrength}
              uDensity={preset.uDensity}
              uFrequency={preset.uFrequency}
              color1={preset.color1}
              color2={preset.color2}
              color3={preset.color3}
              cDistance={preset.cDistance}
              cPolarAngle={preset.cPolarAngle}
              cAzimuthAngle={preset.cAzimuthAngle}
              lightType="3d"
              brightness={preset.brightness}
              grain={variant === "birthday" ? "off" : "on"}
              shader="defaults"
            />
          </CanvasComp>
        )}
      </div>
      <div className="shader-band__noise" aria-hidden="true" />
      <div className="shader-band__content">{children}</div>
    </div>
  );
}
