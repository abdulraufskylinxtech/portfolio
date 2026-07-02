"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

const RUBBER_SPRING = { stiffness: 260, damping: 13, mass: 0.75 };

type Props = {
  src: string;
  alt: string;
  className?: string;
  hint?: string;
};

export function HeroPortrait3D({ src, alt, className, hint }: Props) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const scale = useMotionValue(1);

  const springX = useSpring(dragX, RUBBER_SPRING);
  const springY = useSpring(dragY, RUBBER_SPRING);
  const springRotateY = useSpring(rotateY, RUBBER_SPRING);
  const springRotateX = useSpring(rotateX, RUBBER_SPRING);
  const springScale = useSpring(scale, RUBBER_SPRING);

  const stretchX = useTransform(springScale, (s) => 1 + (s - 1) * 0.55);
  const stretchY = useTransform(springScale, (s) => 1 - (s - 1) * 0.35);

  const resetRubber = () => {
    dragX.set(0);
    dragY.set(0);
    rotateY.set(0);
    rotateX.set(0);
    scale.set(1);
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative h-[220px] w-[220px] rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background sm:h-[240px] sm:w-[240px] md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px] xl:h-[340px] xl:w-[340px]"
        style={{ perspective: "1200px" }}
        data-cursor-hover
      >
        <motion.div
          className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
          style={{
            x: springX,
            y: springY,
            rotateY: springRotateY,
            rotateX: springRotateX,
            scaleX: stretchX,
            scaleY: stretchY,
            transformStyle: "preserve-3d",
            clipPath: "circle(50% at 50% 50%)",
          }}
          drag
          dragMomentum={false}
          dragElastic={0.55}
          dragTransition={{ bounceStiffness: 280, bounceDamping: 11 }}
          onDrag={(_, info) => {
            const { x, y } = info.offset;
            const pull = Math.hypot(x, y);

            dragX.set(x * 0.42);
            dragY.set(y * 0.42);
            rotateY.set(x * 0.55);
            rotateX.set(Math.max(-20, Math.min(20, -y * 0.28)));
            scale.set(1 + Math.min(0.08, pull * 0.00055));
          }}
          onDragEnd={resetRubber}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="h-full w-full select-none rounded-full object-cover object-[center_20%] shadow-[0_20px_50px_hsl(var(--primary)/0.3)]"
            style={{ transform: "translateZ(40px)" }}
          />
        </motion.div>
      </div>
      <div className="mt-2 h-3 w-20 rounded-full bg-primary/25 blur-md lg:h-4 lg:w-24" aria-hidden />
      {hint ? (
        <p className="mt-2 text-center text-xs text-muted-foreground lg:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}
