"use client";

import Image from "next/image";
import { Download, FolderGit2, MessageSquare, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import { HeroAtmosphere } from "@/components/HeroAtmosphere";
import { Button } from "@/components/ui/button";
import { useSiteInfo } from "@/components/providers/content-provider";
import { Link } from "@/i18n/navigation";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useSunShadow } from "@/hooks/useSunShadow";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";

const HERO_SCROLL_THRESHOLD = 400;

interface HeroProps {
  onChatOpen?: () => void;
}

export function Hero({ onChatOpen }: HeroProps) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const site = useSiteInfo();
  const cv = site.cv;
  const roles = useMemo(() => t.raw("roles") as string[], [t]);
  const typed = useTypewriter(roles);
  const scrolledPastHero = useScrollPosition(HERO_SCROLL_THRESHOLD);
  const showHeroAvatar = !scrolledPastHero;

  const heroRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  const { dropShadow: nameShadow } = useSunShadow(heroRef, nameRef, showHeroAvatar);
  const { boxShadow: avatarShadow } = useSunShadow(heroRef, avatarRef, showHeroAvatar);
  const { dropShadow: taglineShadow } = useSunShadow(heroRef, taglineRef);

  const nameClassName = cn(
    "break-words text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent transition-[filter] duration-1000 sm:text-4xl md:text-6xl lg:text-7xl",
    locale === "ar" && "font-arabic",
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen scroll-mt-24 items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-[url(/hero-bg.jpg)]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/70 to-background/50 dark:from-background/85 dark:via-background/70 dark:to-background/55" />
      <HeroAtmosphere className="z-[1]" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl animate-fade-in-up">
          <AnimatePresence mode="wait">
            {showHeroAvatar ? (
              <motion.div
                key="hero-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-start"
              >
                <div
                  ref={avatarRef}
                  className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 transition-[box-shadow] duration-1000 md:h-40 md:w-40"
                  style={{
                    boxShadow:
                      avatarShadow ?? "0 0 15px hsl(var(--primary) / 0.45)",
                  }}
                >
                  <Image
                    src="/me.jpg"
                    alt={t("name")}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                </div>
                <div className="min-w-0 max-w-full flex-1 text-center md:text-start">
                  <h1
                    ref={nameRef}
                    className={nameClassName}
                    style={nameShadow ? { filter: nameShadow } : undefined}
                  >
                    {t("name")}
                  </h1>
                  <p className="mt-3 min-h-[1.75rem] max-w-full break-words text-base text-primary sm:text-lg md:text-xl">
                    <span className="inline-block max-w-full">{typed}</span>
                    <span className="animate-pulse">|</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hero-title-only"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8 text-center md:text-start"
              >
                <h1
                  ref={nameRef}
                  className={nameClassName}
                  style={nameShadow ? { filter: nameShadow } : undefined}
                >
                  {t("name")}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center">
            <p
              ref={taglineRef}
              className="mb-4 break-words text-base text-foreground/90 transition-[filter] duration-1000 sm:text-lg md:text-2xl"
              style={taglineShadow ? { filter: taglineShadow } : undefined}
            >
              {t("tagline")}
            </p>
            <p className="mx-auto mb-8 max-w-2xl px-1 text-sm text-muted-foreground sm:mb-12 sm:text-base">
              {t("description")}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              {onChatOpen && (
                <Button
                  onClick={onChatOpen}
                  size="lg"
                  className="glow w-full bg-primary hover:bg-primary-glow sm:w-auto"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {t("chatWithAI")}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary/50 hover:border-primary hover:bg-primary/10 sm:w-auto"
                onClick={() =>
                  document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <FolderGit2 className="mr-2 h-5 w-5" />
                {t("viewProjects")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary/50 hover:border-primary hover:bg-primary/10 sm:w-auto"
                asChild
              >
                <Link href="/blog">
                  <Sparkles className="mr-2 h-5 w-5" />
                  {t("readBlog")}
                </Link>
              </Button>
              {cv?.url ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/50 hover:border-primary hover:bg-primary/10 sm:w-auto"
                  asChild
                >
                  <a href={cv.url} download={cv.filename}>
                    <Download className="mr-2 h-5 w-5" />
                    {t("downloadCv")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </section>
  );
}
