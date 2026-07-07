"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useState, type ReactNode } from "react";

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
  "relative h-[clamp(230px,30vw,380px)] w-[clamp(230px,30vw,380px)]";

const CODE_RING_OUTER =
  " import · async · def · class · Python · FastAPI · Django · REST · API · await · return · ";
const CODE_RING_INNER =
  " SQL · RAG · LLM · Docker · Git · const · LangChain · Groq · Redis · Celery · JWT · ";

function CodeOrbitRing({
  text,
  radius,
  reverse,
  duration,
  className,
}: {
  text: string;
  radius: number;
  reverse?: boolean;
  duration: string;
  className?: string;
}) {
  const pathId = useId().replace(/:/g, "");
  const center = 100;
  const pathD = `M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`;

  return (
    <svg
      className={cn(
        "hero-portrait-code-orbit pointer-events-none absolute inset-0",
        reverse && "hero-portrait-code-orbit-reverse",
        className,
      )}
      viewBox="0 0 200 200"
      style={{ animationDuration: duration }}
      aria-hidden
    >
      <defs>
        <path id={pathId} d={pathD} fill="none" />
      </defs>
      <text className="hero-portrait-code-text" dominantBaseline="middle">
        <textPath href={`#${pathId}`} startOffset="0%">
          {text.repeat(2)}
        </textPath>
      </text>
    </svg>
  );
}

function PortraitFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(frameClass, "relative isolate shrink-0", className)}>
      <div
        className="hero-portrait-galaxy-glow pointer-events-none absolute -inset-5 rounded-full opacity-60"
        aria-hidden
      />

      <div className="relative h-full w-full rounded-full">
        <div className="absolute inset-[8px] z-[8] overflow-hidden rounded-full sm:inset-[9px]">
          {children}
        </div>
        <CodeOrbitRing text={CODE_RING_OUTER} radius={92} duration="20s" className="z-10" />
        <CodeOrbitRing
          text={CODE_RING_INNER}
          radius={84}
          reverse
          duration="28s"
          className="z-10 opacity-80"
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
