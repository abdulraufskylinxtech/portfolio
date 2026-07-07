"use client";

import { useEffect, useRef } from "react";

import { canvasDpr, runCanvasLoop } from "@/lib/canvas-loop";
import { cn } from "@/lib/utils";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

const STAR_COUNT = 150;

export function Starfield({
  className,
  active = true,
}: {
  className?: string;
  active?: boolean;
  themeDark?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let stars: Star[] = [];

    const resize = () => {
      const dpr = canvasDpr();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
          drawCtx.fillStyle = `rgba(148, 230, 178, ${opacity * 0.85})`;
          drawCtx.fill();
        }
      },
      { fps: 30 },
    );

    resize();
    initStars();

    const onResize = () => {
      resize();
      initStars();
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopLoop();
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

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
