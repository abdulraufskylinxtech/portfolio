"use client";

import { Brain, Cloud, Monitor, Server } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef } from "react";

import { useSiteInfo } from "@/components/providers/content-provider";
import { cn } from "@/lib/utils";

type CategoryKey = "frontend" | "backend" | "devops" | "aiml";

const CATEGORY_META: Record<CategoryKey, LucideIcon> = {
  frontend: Monitor,
  backend: Server,
  devops: Cloud,
  aiml: Brain,
};

export function SkillsSection() {
  const t = useTranslations("skills");
  const locale = useLocale();
  const site = useSiteInfo();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  const categories = (Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => ({
    key,
    Icon: CATEGORY_META[key],
    items: site.skills[key] ?? [],
  }));

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.12,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemMotion = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      ref={ref}
      id="skills"
      className="section-alt scroll-mt-24 border-y border-border py-20 sm:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          className="mb-14 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("sectionLabel")}
          </p>
          <h2
            className={cn(
              "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
              locale === "ar" && "font-arabic",
            )}
          >
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-4"
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          {categories.map(({ key, Icon, items }) => (
            <motion.article
              key={key}
              variants={itemMotion}
              className={cn(
                "group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-[border-color,box-shadow] duration-300",
                "hover:border-primary/50 hover:shadow-[0_0_28px_hsl(var(--primary)/0.18)]",
              )}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition group-hover:border-primary/50">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3
                  className={cn(
                    "text-lg font-semibold text-primary",
                    locale === "ar" && "font-arabic",
                  )}
                >
                  {t(`categories.${key}`)}
                </h3>
              </div>
              <ul className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <li key={skill}>
                    <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur-sm transition group-hover:border-primary/35 group-hover:bg-primary/15">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
