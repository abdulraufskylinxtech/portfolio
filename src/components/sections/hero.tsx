"use client";

import { Download, FolderGit2, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import { HeroAtmosphere } from "@/components/HeroAtmosphere";
import { Button } from "@/components/ui/button";
import { useSiteInfo, useLocalizedSite } from "@/components/providers/content-provider";
import { getHeroRoles } from "@/lib/data";
import { Link } from "@/i18n/navigation";
import { useSunShadow } from "@/hooks/useSunShadow";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";

interface HeroProps {
  onChatOpen?: () => void;
}

export function Hero({ onChatOpen }: HeroProps) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const site = useLocalizedSite();
  const rawSite = useSiteInfo();
  const cv = rawSite.cv;
  const displayName = site.name;
  const roles = useMemo(() => getHeroRoles(site), [site]);
  const typed = useTypewriter(roles);

  const heroRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  const { dropShadow: nameShadow } = useSunShadow(heroRef, nameRef, true);
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
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[hsl(var(--hero-wash)/0.92)] via-background/75 to-background/55 dark:from-background/88 dark:via-background/72 dark:to-background/58" />
      <HeroAtmosphere className="z-[1]" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl animate-fade-in-up">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 text-center md:text-start"
          >
            <h1
              ref={nameRef}
              className={nameClassName}
              style={nameShadow ? { filter: nameShadow } : undefined}
            >
              {displayName}
            </h1>
            <p className="mt-3 min-h-[1.75rem] max-w-full break-words text-base text-primary sm:text-lg md:text-xl">
              <span className="inline-block max-w-full">{typed}</span>
              <span className="animate-pulse">|</span>
            </p>
          </motion.div>

          <div className="text-center md:text-start">
            <p
              ref={taglineRef}
              className="mb-4 break-words text-base text-foreground/90 transition-[filter] duration-1000 sm:text-lg md:text-2xl"
              style={taglineShadow ? { filter: taglineShadow } : undefined}
            >
              {site.role}
            </p>
            <p className="mx-auto mb-8 max-w-2xl px-1 text-sm text-muted-foreground sm:mb-12 sm:text-base md:mx-0">
              {site.bio}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4 md:justify-start">
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
