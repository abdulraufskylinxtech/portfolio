"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSiteInfo } from "@/components/providers/content-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./language-switcher";
import ThemeToggle from "../ThemeToggle";

const NAV_SECTION_IDS = ["hero", "projects", "skills", "experience", "about", "contact"] as const;
const HERO_SCROLL_THRESHOLD = 400;
const MOBILE_NAV_HEIGHT = "3.5rem";

type SectionLink = {
  kind: "section";
  id: (typeof NAV_SECTION_IDS)[number];
  label: string;
};

type PageLink = {
  kind: "page";
  href: "/blog";
  label: string;
  isActive: (pathname: string) => boolean;
};

type CvLink = {
  kind: "cv";
  label: string;
  url: string;
  filename: string;
};

type NavLink = SectionLink | PageLink | CvLink;

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const scrolled = useScrollPosition(32);
  const scrolledPastHero = useScrollPosition(HERO_SCROLL_THRESHOLD);
  const isHome = pathname === "/";
  const activeSection = useActiveSection(isHome ? NAV_SECTION_IDS : []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const site = useSiteInfo();
  const cv = site.cv;

  const [isLargeScreen, setIsLargeScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLargeScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const showAvatar = isLargeScreen && (!isHome || scrolledPastHero);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);

  const links: NavLink[] = [
    { kind: "section", id: "hero", label: t("home") },
    { kind: "section", id: "projects", label: t("projects") },
    { kind: "section", id: "skills", label: t("skills") },
    { kind: "section", id: "experience", label: t("experience") },
    { kind: "section", id: "about", label: t("about") },
    { kind: "section", id: "contact", label: t("contact") },
    ...(cv?.url
      ? [
          {
            kind: "cv" as const,
            label: cv.label?.trim() || t("resume"),
            url: cv.url,
            filename: cv.filename,
          },
        ]
      : []),
    {
      kind: "page",
      href: "/blog",
      label: t("blog"),
      isActive: (path) => path === "/blog" || path.startsWith("/blog/"),
    },
  ];

  const isLinkActive = (item: NavLink) => {
    if (item.kind === "page") return item.isActive(pathname);
    if (item.kind === "cv") return false;
    return isHome && activeSection === item.id;
  };

  const linkClassName = (active: boolean) =>
    cn(
      "relative pb-1 text-sm font-medium transition-colors",
      active ? "text-primary" : "text-foreground/80 hover:text-primary",
    );

  const mobileLinkClassName =
    "rounded-lg px-3 py-3 text-foreground/90 hover:bg-primary/10 hover:text-primary";

  const closeMobile = () => setMobileOpen(false);

  const renderNavLink = (item: NavLink, mobile = false) => {
    const active = isLinkActive(item);
    const className = mobile ? mobileLinkClassName : linkClassName(active);

    if (item.kind === "page") {
      return (
        <Link
          key={item.label}
          href={item.href}
          className={cn(className, mobile && active && "bg-primary/10 text-primary")}
          onClick={mobile ? closeMobile : undefined}
        >
          {item.label}
        </Link>
      );
    }

    if (item.kind === "cv") {
      return (
        <a
          key={item.label}
          href={item.url}
          download={item.filename}
          className={cn(className, mobile && "bg-primary/10 text-primary")}
          onClick={mobile ? closeMobile : undefined}
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        href={{ pathname: "/", hash: item.id }}
        className={cn(className, mobile && active && "bg-primary/10 text-primary")}
        onClick={mobile ? closeMobile : undefined}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
          "max-lg:glass max-lg:border-b max-lg:border-border/50 max-lg:shadow-lg",
          scrolled || !isHome
            ? "lg:glass lg:border-b lg:border-border/50 lg:py-3 lg:shadow-lg"
            : "lg:bg-transparent lg:py-5",
          "py-3",
        )}
        style={{ minHeight: MOBILE_NAV_HEIGHT }}
      >
        <div className="container mx-auto flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-2 sm:gap-3"
            onClick={closeMobile}
          >
            <AnimatePresence>
              {showAvatar && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 40 }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative hidden h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.35)] lg:block"
                >
                  <Image
                    src="/me.jpg"
                    alt={t("home")}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <span
              className={cn(
                "truncate text-base font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent sm:text-lg lg:text-xl",
                locale === "ar" && "font-arabic sm:text-xl lg:text-2xl",
              )}
            >
              {locale === "ar" ? "شكيل لطيف" : "Shakeel Latif"}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {links.map((item) => renderNavLink(item))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <LanguageSwitcher compact className="lg:hidden" />
            <LanguageSwitcher className="hidden lg:block" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-md lg:hidden"
              style={{ top: MOBILE_NAV_HEIGHT }}
              onClick={closeMobile}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed inset-x-0 z-[49] border-b border-border glass lg:hidden"
              style={{
                top: MOBILE_NAV_HEIGHT,
                maxHeight: `calc(100dvh - ${MOBILE_NAV_HEIGHT})`,
              }}
            >
              <nav
                className="flex max-h-[inherit] flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-4"
                aria-label="Mobile"
              >
                {links.map((item) => renderNavLink(item, true))}
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
