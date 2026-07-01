"use client";

import { useEffect, useRef } from "react";

import { useSiteInfo } from "@/components/providers/content-provider";
import { canvasDpr, runCanvasLoop } from "@/lib/canvas-loop";
import { drawMoonDisc, getMoonArcPosition, type MoonArcPosition } from "@/lib/moon-position";
import { cn } from "@/lib/utils";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

const STAR_COUNT = 150;
const CELESTIAL_MS = 10_000;

export function Starfield({
  className,
  active = true,
  themeDark = false,
}: {
  className?: string;
  active?: boolean;
  themeDark?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latitude = useSiteInfo().map?.latitude ?? 31.48;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let stars: Star[] = [];
    let moonBuffer: HTMLCanvasElement | null = null;
    let moonKey = "";
    let cachedMoon: MoonArcPosition | null = null;
    let celestialAt = 0;

    const resize = () => {
      const dpr = canvasDpr();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      moonKey = "";
    };

    const initStars = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w - w / 2,
        y: Math.random() * h - h / 2,
        z: Math.random() * w,
        size: Math.random() * 1.5 + 0.5,
      }));
    };

    const getMoon = (w: number, h: number) => {
      const now = Date.now();
      if (!cachedMoon || now - celestialAt >= CELESTIAL_MS) {
        cachedMoon = getMoonArcPosition(new Date(), w, h, latitude, { themeDark });
        celestialAt = now;
        moonKey = "";
      }
      return cachedMoon;
    };

    const blitMoon = (w: number, h: number, moon: MoonArcPosition) => {
      const moonRadius = 16 + moon.elevation * 14;
      const key = `${w}x${h}:${Math.round(moon.x)}:${Math.round(moon.y)}:${moonRadius.toFixed(1)}:${moon.hijri.day}:${moon.hijri.month}:${moon.phase.toFixed(3)}:${moon.illumination.toFixed(3)}:${moon.opacity.toFixed(2)}`;
      if (key !== moonKey) {
        moonKey = key;
        if (!moonBuffer) moonBuffer = document.createElement("canvas");
        const pad = moonRadius * 5;
        const bw = Math.ceil(pad * 2);
        const bh = Math.ceil(pad * 2);
        const dpr = canvasDpr();
        moonBuffer.width = bw * dpr;
        moonBuffer.height = bh * dpr;
        const bctx = moonBuffer.getContext("2d");
        if (bctx) {
          bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          bctx.clearRect(0, 0, bw, bh);
          drawMoonDisc(
            bctx,
            pad,
            pad,
            moonRadius,
            moon.phase,
            moon.illumination,
            moon.isWaxing,
            moon.opacity,
          );
        }
      }
      if (moonBuffer) {
        const pad = moonRadius * 5;
        ctx.drawImage(moonBuffer, moon.x - pad, moon.y - pad, pad * 2, pad * 2);
      }
    };

    const stopLoop = runCanvasLoop(
      canvas,
      (drawCtx, w, h) => {
        drawCtx.clearRect(0, 0, w, h);

        for (const star of stars) {
          star.z -= 0.8;
          if (star.z <= 0) {
            star.x = Math.random() * w - w / 2;
            star.y = Math.random() * h - h / 2;
            star.z = w;
          }

          const sx = (star.x / star.z) * w + w / 2;
          const sy = (star.y / star.z) * h + h / 2;
          const radius = (1 - star.z / w) * star.size * 2;
          const opacity = Math.min(1, (1 - star.z / w) * 1.5);

          if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

          drawCtx.beginPath();
          drawCtx.arc(sx, sy, Math.max(0.3, radius), 0, Math.PI * 2);
          drawCtx.fillStyle = `rgba(100, 220, 255, ${opacity * 0.85})`;
          drawCtx.fill();
        }

        blitMoon(w, h, getMoon(w, h));
      },
      { fps: 30 },
    );

    resize();
    initStars();

    const onResize = () => {
      resize();
      initStars();
      cachedMoon = null;
      moonKey = "";
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopLoop();
      window.removeEventListener("resize", onResize);
    };
  }, [latitude, active, themeDark]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full [contain:strict] [transform:translateZ(0)]",
        className,
      )}
      aria-hidden
    />
  );
}
