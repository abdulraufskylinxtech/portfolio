"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  hint?: string;
};

export function HeroPortrait3D({ src, alt, className, hint }: Props) {
  const [rotation, setRotation] = useState({ y: 0, x: 0 });
  const start = useRef({ x: 0, y: 0, rotY: 0, rotX: 0 });

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative h-[260px] w-[200px] sm:h-[280px] sm:w-[220px] lg:h-[320px] lg:w-[250px]"
        style={{ perspective: "1200px" }}
        data-cursor-hover
      >
        <motion.div
          className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
          style={{
            rotateY: rotation.y,
            rotateX: rotation.x,
            transformStyle: "preserve-3d",
          }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={(_, info) => {
            start.current = {
              x: info.point.x,
              y: info.point.y,
              rotY: rotation.y,
              rotX: rotation.x,
            };
          }}
          onDrag={(_, info) => {
            const deltaX = info.point.x - start.current.x;
            const deltaY = info.point.y - start.current.y;
            setRotation({
              y: start.current.rotY + deltaX * 0.65,
              x: Math.max(-22, Math.min(22, start.current.rotX - deltaY * 0.28)),
            });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="h-full w-full select-none object-contain object-bottom drop-shadow-[0_24px_48px_hsl(var(--primary)/0.35)]"
            style={{ transform: "translateZ(40px)" }}
          />
        </motion.div>
      </div>
      <div className="mt-1 h-2 w-24 rounded-full bg-primary/20 blur-md" aria-hidden />
      {hint ? <p className="mt-2 text-center text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
