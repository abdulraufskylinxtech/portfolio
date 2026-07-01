"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

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

  const showNavAvatar = !isHome || scrolledPastHero;

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
          scrolled || !isHome
            ? "glass border-b border-border/50 py-3 shadow-lg"
            : "bg-transparent py-5",
        )}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3"
            onClick={closeMobile}
          >
            <AnimatePresence>
              {showNavAvatar && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 40 }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.35)]"
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
                "text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent",
                locale === "ar" && "font-arabic text-2xl",
              )}
            >
              {locale === "ar" ? "شكيل لطيف" : "Shakeel Latif"}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {links.map((item) => renderNavLink(item))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
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
              onClick={closeMobile}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed left-0 right-0 top-[4.5rem] z-[48] border-b border-border glass lg:hidden"
            >
              <nav className="flex flex-col gap-1 px-4 py-4">
                {links.map((item) => renderNavLink(item, true))}
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
