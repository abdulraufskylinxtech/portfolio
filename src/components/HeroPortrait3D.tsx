"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const HeroProfileModelScene = dynamic(
  () => import("@/components/HeroProfileModelScene").then((mod) => mod.HeroProfileModelScene),
  { ssr: false },
);

type Props = {
  src?: string | null;
  modelSrc?: string | null;
  alt: string;
  className?: string;
};

const frameClass =
  "relative h-[clamp(200px,26vw,340px)] w-[clamp(200px,26vw,340px)]";

const ORBIT_A_COUNT = 16;
const ORBIT_B_COUNT = 10;

function GalaxyOrbit({
  count,
  duration,
  reverse,
  className,
}: {
  count: number;
  duration: string;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hero-portrait-orbit pointer-events-none absolute inset-0",
        reverse && "hero-portrait-orbit-reverse",
        className,
      )}
      style={{ animationDuration: duration }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "hero-portrait-orbit-arm",
            i % 4 === 0 && "hero-portrait-star-lg",
            i % 2 === 0 && "hero-portrait-star-bright",
          )}
          style={{
            transform: `rotate(${(360 / count) * i}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function PortraitFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(frameClass, "relative isolate shrink-0", className)}>
      <div className="hero-portrait-galaxy-glow pointer-events-none absolute -inset-5 rounded-full" aria-hidden />
      <GalaxyOrbit count={ORBIT_A_COUNT} duration="20s" className="z-[1]" />
      <GalaxyOrbit count={ORBIT_B_COUNT} duration="28s" reverse className="z-[2] opacity-80" />

      <div className="relative h-full w-full rounded-full">
        <div className="absolute inset-[9px] z-[8] overflow-hidden rounded-full sm:inset-[10px]">
          {children}
        </div>
        <div
          className="hero-portrait-ring-aura pointer-events-none absolute -inset-2 z-[9] rounded-full"
          aria-hidden
        />
        <div
          className="hero-portrait-ring-inner pointer-events-none absolute inset-0 z-10 rounded-full"
          aria-hidden
        />
        <div
          className="hero-portrait-ring pointer-events-none absolute inset-0 z-[11] rounded-full"
          aria-hidden
        />
      </div>
    </div>
  );
}

const portraitMediaClass =
  "mx-auto h-full w-full max-w-none origin-bottom scale-[1.14] object-contain object-bottom";

function ImagePortrait({ src, alt }: { src: string; alt: string }) {
  return (
    <PortraitFrame>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={portraitMediaClass}
      />
    </PortraitFrame>
  );
}

function PortraitCaption({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-center text-[11px] text-muted-foreground">{children}</p>;
}

export function HeroPortrait3D({ src, modelSrc, alt, className }: Props) {
  const image = src?.trim() || "";
  const model = modelSrc?.trim() || "";
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  const showModel = Boolean(model && !image && !modelFailed);

  useEffect(() => {
    setModelReady(false);
    setModelFailed(false);
  }, [model, image]);

  if (showModel) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <PortraitFrame>
          <div className="relative h-full w-full">
            {!modelReady ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground/70" />
              </div>
            ) : null}
            <HeroProfileModelScene
              url={model}
              className="absolute inset-0 z-10 h-full w-full"
              onReady={() => setModelReady(true)}
              onError={() => setModelFailed(true)}
            />
          </div>
        </PortraitFrame>
      </div>
    );
  }

  if (modelFailed && image) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <ImagePortrait src={image} alt={alt} />
        <PortraitCaption>3D model failed — showing photo</PortraitCaption>
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ImagePortrait src={image} alt={alt} />
    </div>
  );
}
