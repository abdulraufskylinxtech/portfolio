"use client";

import { Fragment, useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { useSiteInfo } from "@/components/providers/content-provider";
import { isExperiencePublished, type ExperienceEntry } from "@/lib/data";
import { isRtlLocale } from "@/lib/locale-catalog";
import { cn } from "@/lib/utils";

const METRIC_REGEX = /(\d+(?:\.\d+)?%|\d+[kK]\+?|\d+\+|\b\d+\b)/g;

function isMetricToken(segment: string): boolean {
  return /^(?:\d+(?:\.\d+)?%|\d+[kK]\+?|\d+\+|\d+)$/.test(segment);
}

function BulletWithMetrics({ text, fragmentKey }: { text: string; fragmentKey: string }) {
  const parts = text.split(METRIC_REGEX);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "") return null;
        if (isMetricToken(part)) {
          return (
            <span
              key={`${fragmentKey}-m-${i}`}
              className="font-semibold text-primary tabular-nums"
            >
              {part}
            </span>
          );
        }
        return <Fragment key={`${fragmentKey}-t-${i}`}>{part}</Fragment>;
      })}
    </>
  );
}

function experienceDuration(entry: ExperienceEntry, locale: string): string | null {
  if (!entry.startDate) return null;
  const endDate = entry.current
    ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
    : entry.endDate;
  if (!endDate) return null;

  const [startYear, startMonth] = entry.startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const totalMonths = (endYear - startYear) * 12 + endMonth - startMonth + 1;
  if (totalMonths <= 0) return null;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const yearFormatter = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "year",
    unitDisplay: "long",
  });
  const monthFormatter = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "month",
    unitDisplay: "long",
  });

  return [years ? yearFormatter.format(years) : "", months ? monthFormatter.format(months) : ""]
    .filter(Boolean)
    .join(" ");
}

export function ExperienceSection() {
  const t = useTranslations("experience");
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const site = useSiteInfo();
  const entries = useMemo(
    () => site.experience.filter(isExperiencePublished),
    [site.experience],
  );
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  if (entries.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="scroll-mt-24 border-b border-border bg-background py-20 sm:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          className="mb-14 text-center md:text-start"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("sectionLabel")}
          </p>
          <h2
            className={cn(
              "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
              isRtl && "font-arabic",
            )}
          >
            {t("title")}
          </h2>
        </motion.div>

        <div className="relative mx-auto max-w-6xl">
          <div
            className="pointer-events-none absolute top-0 bottom-0 start-3 z-0 w-px bg-gradient-to-b from-primary/70 via-primary/35 to-transparent md:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent md:block"
            aria-hidden
          />

          <ul className="relative z-10 space-y-12 md:space-y-16">
            {entries.map((entry: ExperienceEntry, index: number) => {
              const alignStart = index % 2 === 0;
              const duration = experienceDuration(entry, locale);
              const slideX = reduceMotion
                ? 0
                : !inView
                  ? alignStart
                    ? isRtl
                      ? 44
                      : -44
                    : isRtl
                      ? -44
                      : 44
                  : 0;

              const card = (
                <motion.article
                  initial={reduceMotion ? false : { opacity: 0, x: slideX }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: slideX }}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                    delay: reduceMotion ? 0 : index * 0.08,
                  }}
                  className={cn(
                    "w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-start shadow-lg transition-[border-color,box-shadow] duration-300 md:p-7",
                    "hover:border-primary/45 hover:shadow-[0_0_28px_hsl(var(--primary)/0.15)]",
                  )}
                >
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">{entry.role}</h3>
                  <p className="mt-1 font-medium text-primary">{entry.company}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>{entry.period}</span>
                    {duration ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {duration}
                      </span>
                    ) : null}
                    <span className="text-border" aria-hidden>
                      ·
                    </span>
                    <span>{entry.location}</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-foreground/85">
                    {entry.bullets.filter((bullet) => bullet.trim()).map((bullet, bulletIndex) => (
                      <li
                        key={`${entry.role}-${bulletIndex}`}
                        className="flex items-start gap-2 text-start"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/85"
                          aria-hidden
                        />
                        <span className={cn(isRtl && "font-arabic")}>
                          <BulletWithMetrics
                            text={bullet}
                            fragmentKey={`${index}-${bulletIndex}`}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap justify-start gap-2">
                    {entry.tech.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.article>
              );

              return (
                <li key={`${entry.role}-${entry.period}-${index}`} className="relative">
                  <div
                    className="absolute top-8 z-20 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.55)] md:hidden"
                    style={{ insetInlineStart: "10px" }}
                    aria-hidden
                  />
                  <div className="absolute left-1/2 top-8 z-20 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.55)] md:block" />

                  <div className="ms-10 md:ms-0 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-10">
                    {alignStart ? (
                      <>
                        <div className="md:flex md:justify-end">{card}</div>
                        <div className="hidden md:block" aria-hidden />
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block" aria-hidden />
                        <div>{card}</div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
