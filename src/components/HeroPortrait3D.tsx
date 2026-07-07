"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  "relative h-[220px] w-[220px] sm:h-[240px] sm:w-[240px] md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px] xl:h-[340px] xl:w-[340px]";

function ImagePortrait({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className={cn(
        frameClass,
        "overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-[center_20%] shadow-[0_20px_50px_hsl(var(--primary)/0.3)]"
      />
    </div>
  );
}

export function HeroPortrait3D({ src, modelSrc, alt, className }: Props) {
  const image = src?.trim() || "";
  const model = modelSrc?.trim() || "";
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    setModelReady(false);
    setModelFailed(false);
  }, [model]);

  if (model && !modelFailed) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className={cn(frameClass, "relative overflow-hidden rounded-full")}>
          {!modelReady ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/40">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : null}
          <HeroProfileModelScene
            url={model}
            className="absolute inset-0 z-10 h-full w-full"
            onReady={() => setModelReady(true)}
            onError={() => setModelFailed(true)}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {modelReady ? "Drag to rotate 3D" : "Loading 3D model…"}
        </p>
        <div className="mt-1 h-3 w-24 rounded-full bg-primary/25 blur-md lg:h-4 lg:w-28" aria-hidden />
      </div>
    );
  }

  if (modelFailed && image) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <ImagePortrait src={image} alt={alt} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">3D model failed — showing photo</p>
        <div className="mt-1 h-3 w-20 rounded-full bg-primary/25 blur-md lg:h-4 lg:w-24" aria-hidden />
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ImagePortrait src={image} alt={alt} />
      <div className="mt-2 h-3 w-20 rounded-full bg-primary/25 blur-md lg:h-4 lg:w-24" aria-hidden />
    </div>
  );
}
