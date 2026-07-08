"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { isRtlLocale } from "@/lib/locale-catalog";
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

function splitRingWords(text: string): string[] {
  return text
    .split("·")
    .map((word) => word.trim())
    .filter(Boolean);
}

function CodeOrbitRing({
  text,
  ring,
  reverse,
  duration,
  rtl,
  className,
}: {
  text: string;
  ring: "outer" | "inner";
  reverse?: boolean;
  duration: string;
  rtl?: boolean;
  className?: string;
}) {
  const words = useMemo(() => {
    const items = splitRingWords(text);
    return items.length > 0 ? [...items, ...items] : items;
  }, [text]);

  if (words.length === 0) return null;

  return (
    <div
      className={cn(
        "hero-portrait-code-orbit pointer-events-none absolute",
        ring === "outer" ? "hero-portrait-code-orbit-outer" : "hero-portrait-code-orbit-inner",
        reverse && "hero-portrait-code-orbit-reverse",
        className,
      )}
      style={{ animationDuration: duration }}
      dir={rtl ? "rtl" : "ltr"}
      aria-hidden
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="hero-portrait-code-arm"
          style={{ transform: `rotate(${(360 / words.length) * index}deg)` }}
        >
          <span className={cn("hero-portrait-code-label", rtl && "hero-portrait-code-label-ar")}>
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}

function PortraitFrame({
  children,
  outerText,
  innerText,
  rtl,
  className,
}: {
  children: ReactNode;
  outerText: string;
  innerText: string;
  rtl?: boolean;
  className?: string;
}) {
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
        <CodeOrbitRing
          text={outerText}
          ring="outer"
          duration="20s"
          rtl={rtl}
          className="z-10"
        />
        <CodeOrbitRing
          text={innerText}
          ring="inner"
          reverse
          duration="28s"
          rtl={rtl}
          className="z-10 opacity-90"
        />
      </div>
    </div>
  );
}

const portraitMediaClass =
  "mx-auto h-full w-full max-w-none origin-bottom scale-[1.14] object-contain object-bottom";

function ImagePortrait({
  src,
  alt,
  outerText,
  innerText,
  rtl,
}: {
  src: string;
  alt: string;
  outerText: string;
  innerText: string;
  rtl?: boolean;
}) {
  return (
    <PortraitFrame outerText={outerText} innerText={innerText} rtl={rtl}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={portraitMediaClass} />
    </PortraitFrame>
  );
}

function PortraitCaption({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-center text-[11px] text-muted-foreground">{children}</p>;
}

export function HeroPortrait3D({ src, modelSrc, alt, className }: Props) {
  const locale = useLocale();
  const t = useTranslations("hero");
  const image = src?.trim() || "";
  const model = modelSrc?.trim() || "";
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const isRtl = isRtlLocale(locale);
  const ringText = {
    outer: t("codeRingOuter"),
    inner: t("codeRingInner"),
  };

  const showModel = Boolean(model && !image && !modelFailed);

  useEffect(() => {
    setModelReady(false);
    setModelFailed(false);
  }, [model, image]);

  if (showModel) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <PortraitFrame outerText={ringText.outer} innerText={ringText.inner} rtl={isRtl}>
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
        <ImagePortrait
          src={image}
          alt={alt}
          outerText={ringText.outer}
          innerText={ringText.inner}
          rtl={isRtl}
        />
        <PortraitCaption>3D model failed — showing photo</PortraitCaption>
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ImagePortrait
        src={image}
        alt={alt}
        outerText={ringText.outer}
        innerText={ringText.inner}
        rtl={isRtl}
      />
    </div>
  );
}
