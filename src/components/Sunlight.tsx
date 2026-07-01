"use client";

import { useEffect, useRef } from "react";

import { useSiteInfo } from "@/components/providers/content-provider";
import { canvasDpr, runCanvasLoop } from "@/lib/canvas-loop";
import { getSunArcPositionForLightTheme, type SunArcPosition } from "@/lib/sun-position";
import { cn } from "@/lib/utils";

interface Mote {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
}

const MOTE_COUNT = 55;
const CELESTIAL_MS = 10_000;

function drawSunLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sun: SunArcPosition,
) {
  const { x: sunX, y: sunY, elevation, opacity: sunOpacity } = sun;
  if (sunOpacity <= 0.02) return;

  const coreRadius = 18 + elevation * 22;
  const glowStrength = sunOpacity * (0.35 + elevation * 0.45);

  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, coreRadius * 5.5);
  glow.addColorStop(0, `rgba(255, 220, 120, ${glowStrength})`);
  glow.addColorStop(0.25, `rgba(255, 200, 80, ${glowStrength * 0.55})`);
  glow.addColorStop(0.55, `rgba(255, 180, 60, ${glowStrength * 0.15})`);
  glow.addColorStop(1, "rgba(255, 200, 100, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const core = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, coreRadius);
  core.addColorStop(0, `rgba(255, 248, 220, ${sunOpacity})`);
  core.addColorStop(0.5, `rgba(255, 210, 90, ${sunOpacity * 0.85})`);
  core.addColorStop(1, "rgba(255, 180, 50, 0)");
  ctx.beginPath();
  ctx.arc(sunX, sunY, coreRadius, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();

  const rays = 8;
  const rayLength = coreRadius * (3.5 + elevation * 2);
  ctx.save();
  ctx.translate(sunX, sunY);
  for (let i = 0; i < rays; i++) {
    const rayAngle = (i / rays) * Math.PI * 2;
    ctx.save();
    ctx.rotate(rayAngle);
    ctx.beginPath();
    ctx.moveTo(coreRadius * 1.1, 0);
    ctx.lineTo(rayLength, 0);
    const rayGrad = ctx.createLinearGradient(coreRadius * 1.1, 0, rayLength, 0);
    rayGrad.addColorStop(0, `rgba(255, 210, 90, ${sunOpacity * 0.22 * elevation})`);
    rayGrad.addColorStop(1, "rgba(255, 210, 90, 0)");
    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function Sunlight({
  className,
  active = true,
}: {
  className?: string;
  active?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latitude = useSiteInfo().map?.latitude ?? 31.48;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let motes: Mote[] = [];
    let sunBuffer: HTMLCanvasElement | null = null;
    let sunKey = "";
    let cachedSun: SunArcPosition | null = null;
    let celestialAt = 0;

    const resize = () => {
      const dpr = canvasDpr();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sunKey = "";
    };

    const initMotes = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      motes = Array.from({ length: MOTE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.5 + 0.8,
        speed: Math.random() * 0.35 + 0.15,
        drift: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.45 + 0.25,
      }));
    };

    const getSun = (w: number, h: number) => {
      const now = Date.now();
      if (!cachedSun || now - celestialAt >= CELESTIAL_MS) {
        cachedSun = getSunArcPositionForLightTheme(new Date(), w, h, latitude);
        celestialAt = now;
        sunKey = "";
      }
      return cachedSun;
    };

    const blitSun = (w: number, h: number, sun: SunArcPosition) => {
      const key = `${w}x${h}:${Math.round(sun.x)}:${Math.round(sun.y)}:${sun.elevation.toFixed(2)}:${sun.opacity.toFixed(2)}`;
      if (key !== sunKey) {
        sunKey = key;
        if (!sunBuffer) sunBuffer = document.createElement("canvas");
        const dpr = canvasDpr();
        sunBuffer.width = w * dpr;
        sunBuffer.height = h * dpr;
        const bctx = sunBuffer.getContext("2d");
        if (bctx) {
          bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          bctx.clearRect(0, 0, w, h);
          drawSunLayer(bctx, w, h, sun);
        }
      }
      if (sunBuffer) ctx.drawImage(sunBuffer, 0, 0, w, h);
    };

    const stopLoop = runCanvasLoop(
      canvas,
      (drawCtx, w, h) => {
        drawCtx.clearRect(0, 0, w, h);

        const sun = getSun(w, h);
        blitSun(w, h, sun);

        const moteAlpha = sun.isDaylight ? 1 : 0.35;

        for (const mote of motes) {
          if (!reducedMotion) {
            mote.y -= mote.speed;
            mote.x += mote.drift;
            if (mote.y < -8) {
              mote.y = h + 8;
              mote.x = Math.random() * w;
            }
            if (mote.x < -8) mote.x = w + 8;
            if (mote.x > w + 8) mote.x = -8;
          }

          drawCtx.beginPath();
          drawCtx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
          drawCtx.fillStyle = `rgba(255, 210, 130, ${mote.opacity * moteAlpha})`;
          drawCtx.fill();
        }
      },
      { fps: reducedMotion ? 12 : 30 },
    );

    resize();
    initMotes();

    const onResize = () => {
      resize();
      initMotes();
      cachedSun = null;
      sunKey = "";
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopLoop();
      window.removeEventListener("resize", onResize);
    };
  }, [latitude, active]);

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
