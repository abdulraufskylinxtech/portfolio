"use client";

import Image from "next/image";
import { forwardRef, useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Hero3DAvatarProps = {
  src: string;
  alt: string;
  depthSrc?: string;
  className?: string;
  boxShadow?: string;
};

type Tilt = {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
};

const MAX_TILT = 38;

export const Hero3DAvatar = forwardRef<HTMLDivElement, Hero3DAvatarProps>(function Hero3DAvatar(
  { src, alt, className, boxShadow },
  forwardedRef,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<Tilt>({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 40,
  });
  const [isHovering, setIsHovering] = useState(false);

  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const root = innerRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const x = px - 0.5;
    const y = py - 0.5;

    setIsHovering(true);
    setTilt({
      rotateX: Math.max(-MAX_TILT, Math.min(MAX_TILT, -y * MAX_TILT * 2.2)),
      rotateY: Math.max(-MAX_TILT, Math.min(MAX_TILT, x * MAX_TILT * 2.2)),
      glareX: px * 100,
      glareY: py * 100,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 40 });
  }, []);

  return (
    <div
      ref={setRootRef}
      className={cn("hero-3d-root relative shrink-0", className)}
      data-cursor-hover
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={() => setIsHovering(true)}
      style={boxShadow ? { boxShadow } : undefined}
    >
      <div
        className="hero-3d-viewport"
        style={{
          perspective: "1100px",
          perspectiveOrigin: `${50 + tilt.rotateY * 0.6}% ${50 + tilt.rotateX * 0.6}%`,
        }}
      >
        <div
          className={cn("hero-3d-card", isHovering && "hero-3d-card-active")}
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${isHovering ? 1.03 : 1})`,
          }}
        >
          <div className="hero-3d-portrait">
            <Image src={src} alt={alt} fill className="object-cover" priority sizes="192px" />
            <div
              className="hero-3d-glare"
              style={{
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, hsl(0 0% 100% / 0.45) 0%, transparent 50%)`,
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
});
