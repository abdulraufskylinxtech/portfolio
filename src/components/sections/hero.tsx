"use client";

import { Download, FolderGit2, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { HeroPortrait3D } from "@/components/HeroPortrait3D";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import { HeroAtmosphere } from "@/components/HeroAtmosphere";
import { Button } from "@/components/ui/button";
import { useSiteInfo, useLocalizedSite } from "@/components/providers/content-provider";
import { getHeroRoles, getProfileImage, getProfileModel } from "@/lib/data";
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
  const profileImage = getProfileImage(rawSite);
  const profileModel = getProfileModel(rawSite);
  const showPortrait = Boolean(profileImage || profileModel);
  const roles = useMemo(() => getHeroRoles(site), [site]);
  const typed = useTypewriter(roles);

  const heroRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  const { dropShadow: nameShadow } = useSunShadow(heroRef, nameRef, true);
  const { dropShadow: taglineShadow } = useSunShadow(heroRef, taglineRef);

  const nameClassName = cn(
    "break-words font-bold leading-[1.1] bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent transition-[filter] duration-1000",
    "text-[clamp(2rem,4.2vw+0.5rem,4.5rem)]",
    locale === "ar" && "font-arabic",
  );

  const isRtl = locale === "ar";

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen scroll-mt-24 items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-[url(/hero-bg.jpg)]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[hsl(var(--hero-wash)/0.92)] via-background/75 to-background/55 dark:from-background/88 dark:via-background/72 dark:to-background/58" />
      <HeroAtmosphere className="z-[1]" />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mx-auto flex w-full animate-fade-in-up flex-col items-center gap-6 py-6 sm:gap-7 sm:py-8",
            "lg:max-w-[min(100%,56rem)] lg:flex-row lg:items-center lg:justify-center lg:gap-10",
            "xl:max-w-[min(100%,64rem)] xl:gap-12",
            "2xl:max-w-7xl 2xl:justify-between 2xl:gap-16",
            showPortrait && isRtl && "lg:flex-row-reverse",
          )}
        >
          {showPortrait ? (
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="order-1 shrink-0 lg:order-none"
            >
              <HeroPortrait3D
                src={profileImage}
                modelSrc={profileModel}
                alt={displayName}
              />
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "order-2 min-w-0 w-full flex-1 text-center lg:pt-0",
              profileImage || showPortrait ? "lg:order-none lg:text-start" : "max-w-4xl",
              isRtl && (profileImage || showPortrait) && "lg:text-end",
            )}
          >
            <h1
              ref={nameRef}
              className={nameClassName}
              style={nameShadow ? { filter: nameShadow } : undefined}
            >
              {displayName}
            </h1>

            <p className="mt-3 min-h-[1.75rem] font-medium text-primary text-[clamp(1rem,1.2vw+0.65rem,1.35rem)]">
              <span className="inline-block max-w-full">{typed}</span>
              <span className="animate-pulse">|</span>
            </p>

            <p
              ref={taglineRef}
              className="mt-3 break-words font-medium text-foreground/90 transition-[filter] duration-1000 text-[clamp(1.05rem,1.6vw+0.55rem,1.65rem)]"
              style={taglineShadow ? { filter: taglineShadow } : undefined}
            >
              {site.role}
            </p>

            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground text-[clamp(0.875rem,0.9vw+0.55rem,1.125rem)] lg:mx-0 lg:max-w-2xl">
              {site.bio}
            </p>

            <div className="mt-8 space-y-3 lg:mt-10">
              <div
                className={cn(
                  "flex flex-col gap-3 sm:flex-row",
                  isRtl ? "sm:justify-end" : "sm:justify-start",
                )}
              >
                {onChatOpen ? (
                  <Button
                    onClick={onChatOpen}
                    size="lg"
                    className="glow w-full bg-primary hover:bg-primary-glow sm:min-w-[200px] sm:flex-1 sm:max-w-[240px] lg:h-12 lg:min-w-[220px] lg:max-w-[280px] lg:text-base"
                  >
                    <MessageSquare className="mr-2 h-5 w-5 lg:h-5 lg:w-5" />
                    {t("chatWithAI")}
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/50 hover:border-primary hover:bg-primary/10 sm:min-w-[200px] sm:flex-1 sm:max-w-[240px] lg:h-12 lg:min-w-[220px] lg:max-w-[280px] lg:text-base"
                  onClick={() =>
                    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <FolderGit2 className="mr-2 h-5 w-5" />
                  {t("viewProjects")}
                </Button>
              </div>

              <div
                className={cn(
                  "flex flex-wrap items-center justify-center gap-2 sm:gap-3",
                  isRtl ? "lg:justify-end" : "lg:justify-start",
                )}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 border border-border/80 bg-card/60 px-4 hover:bg-primary/10 lg:h-11 lg:px-5 lg:text-sm"
                  asChild
                >
                  <Link href="/blog">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("readBlog")}
                  </Link>
                </Button>
                {cv?.url ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10 border border-border/80 bg-card/60 px-4 hover:bg-primary/10 lg:h-11 lg:px-5 lg:text-sm"
                    asChild
                  >
                    <a href={cv.url} download={cv.filename}>
                      <Download className="mr-2 h-4 w-4" />
                      {t("downloadCv")}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </section>
  );
}
