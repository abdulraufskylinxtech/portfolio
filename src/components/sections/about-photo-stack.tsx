"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const PHOTO_LAYERS = [
  {
    z: "z-10",
    idle: "-rotate-6 -translate-x-1 translate-y-1",
    hover:
      "group-hover:-rotate-12 group-hover:-translate-x-14 group-hover:-translate-y-2",
  },
  {
    z: "z-20",
    idle: "rotate-2",
    hover: "group-hover:-translate-y-6 group-hover:scale-105 group-hover:rotate-0",
  },
  {
    z: "z-30",
    idle: "rotate-8 translate-x-2 translate-y-2",
    hover:
      "group-hover:rotate-[14deg] group-hover:translate-x-14 group-hover:-translate-y-1",
  },
] as const;

const SINGLE_LAYER = {
  z: "z-20",
  idle: "rotate-0",
  hover: "group-hover:-translate-y-2 group-hover:scale-[1.02]",
} as const;

type AboutPhotoStackProps = {
  images: string[];
  alt: string;
};

export function AboutPhotoStack({ images, alt }: AboutPhotoStackProps) {
  const photos = [...new Set(images.map((src) => src.trim()).filter(Boolean))].slice(0, 3);
  if (photos.length === 0) photos.push("/me.jpg");

  const layers =
    photos.length === 1
      ? [SINGLE_LAYER]
      : PHOTO_LAYERS.slice(0, photos.length);

  const isSingle = photos.length === 1;

  return (
    <div
      className={cn(
        "group relative mx-auto",
        isSingle ? "h-[280px] w-[220px] sm:h-[300px] sm:w-[240px]" : "h-[260px] w-[220px] sm:h-[280px] sm:w-[240px]",
      )}
      data-cursor-hover
    >
      {photos.map((src, index) => {
        const layer = layers[index] ?? PHOTO_LAYERS[index];
        return (
          <div
            key={`${src}-${index}`}
            className={cn(
              "absolute inset-x-0 mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isSingle
                ? "top-6 h-[240px] w-[200px] sm:h-[260px] sm:w-[220px]"
                : "top-4 h-[220px] w-[180px] sm:h-[240px] sm:w-[200px]",
              layer.z,
              layer.idle,
              layer.hover,
              "group-hover:shadow-[0_20px_50px_hsl(var(--primary)/0.25)]",
            )}
          >
            <div className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-lg transition-colors duration-300 group-hover:border-primary/60">
              <Image
                src={src}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-cover"
                sizes="220px"
                priority={index === 0 || (photos.length > 1 && index === 1)}
              />
            </div>
          </div>
        );
      })}
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}
