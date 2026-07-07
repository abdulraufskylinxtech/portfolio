"use client";

import { Award, BookOpen, GraduationCap, Heart, MapPin, Layers, Wrench } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import { AboutPhotoStack } from "@/components/sections/about-photo-stack";
import { useLocalizedSite } from "@/components/providers/content-provider";
import type { EducationEntry } from "@/lib/data";
import { groupEducation } from "@/lib/education-groups";
import { cn } from "@/lib/utils";

function EducationTypeBadge({
  type,
  label,
}: {
  type: EducationEntry["type"];
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        type === "degree" && "border border-primary/30 bg-primary/10 text-primary",
        type === "certificate" && "border border-accent/30 bg-accent/10 text-accent dark:text-accent",
        type === "course" && "border border-primary/30 bg-primary/10 text-primary dark:text-primary",
        type === "training" && "border border-secondary/30 bg-secondary/10 text-secondary dark:text-secondary",
      )}
    >
      {label}
    </span>
  );
}

function FormalEducationList({ items }: { items: EducationEntry[] }) {
  if (items.length === 0) return null;

  return (
    <ol className="relative space-y-0 border-s border-border ps-6">
      {items.map((item) => (
        <li key={`${item.degree}-${item.year}`} className="relative pb-6 last:pb-0">
          <span
            className="absolute -start-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
            aria-hidden
          />
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-foreground">{item.degree}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.institution}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
                {item.year}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EducationSubsection({
  title,
  icon,
  items,
  typeLabel,
  isRtl,
}: {
  title: string;
  icon: React.ReactNode;
  items: EducationEntry[];
  typeLabel: (type: EducationEntry["type"]) => string;
  isRtl: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4
        className={cn(
          "mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground",
          isRtl && "font-arabic",
        )}
      >
        {icon}
        {title}
      </h4>
      <QualificationsGrid items={items} typeLabel={typeLabel} />
    </div>
  );
}

function QualificationsGrid({
  items,
  typeLabel,
}: {
  items: EducationEntry[];
  typeLabel: (type: EducationEntry["type"]) => string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.degree}-${item.year}`}
          className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <EducationTypeBadge type={item.type} label={typeLabel(item.type)} />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
              {item.year}
            </span>
          </div>
          <p className="font-semibold leading-snug text-foreground">{item.degree}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.institution}</p>
        </div>
      ))}
    </div>
  );
}

export function AboutSection() {
  const t = useTranslations("about");
  const locale = useLocale();
  const site = useLocalizedSite();
  const isRtl = locale === "ar";
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  const { formal, certificates, courses, trainings } = useMemo(
    () => groupEducation(site.education),
    [site.education],
  );

  const slidePhoto = reduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: inView ? 1 : 0, x: inView ? 0 : isRtl ? 56 : -56 };

  const slideText = reduceMotion
    ? { opacity: 1, x: 0 }
    : { opacity: inView ? 1 : 0, x: inView ? 0 : isRtl ? -56 : 56 };

  const educationTypeLabel = (type: EducationEntry["type"]) =>
    t(`educationTypes.${type}` as "educationTypes.degree");

  return (
    <section
      ref={ref}
      id="about"
      className="scroll-mt-24 border-b border-border bg-background py-20 sm:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-14 lg:flex-row lg:items-start lg:gap-16">
          <motion.div
            className="flex w-full shrink-0 flex-col items-center lg:w-[min(100%,380px)]"
            initial={false}
            animate={slidePhoto}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={cn(
                "group w-full max-w-[320px] rounded-3xl border border-border bg-card p-6 shadow-lg transition-[border-color,box-shadow] duration-300 sm:p-8",
                "hover:border-border hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
              )}
            >
              <AboutPhotoStack images={site.aboutImages} alt={t("title")} />
              <p className="mt-6 text-center text-sm font-semibold text-primary">{site.role}</p>
            </div>
            <p
              className={cn(
                "mt-4 inline-flex max-w-[320px] items-center justify-center rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-center text-xs font-medium leading-snug text-primary sm:text-sm",
                isRtl && "font-arabic",
              )}
            >
              {site.availability}
            </p>
          </motion.div>

          <motion.div
            className="min-w-0 flex-1 space-y-10"
            initial={false}
            animate={slideText}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
              delay: reduceMotion ? 0 : 0.08,
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {t("sectionLabel")}
              </p>
              <h2
                className={cn(
                  "mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
                  isRtl && "font-arabic",
                )}
              >
                {t("title")}
              </h2>
              <p
                className={cn(
                  "mt-3 flex items-center gap-2 text-sm font-medium text-primary sm:text-base",
                  isRtl && "font-arabic",
                )}
              >
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {site.location}
              </p>
              <p
                className={cn(
                  "mt-5 max-w-2xl border-s-[3px] border-primary/45 ps-5 text-lg leading-relaxed text-muted-foreground",
                  isRtl && "font-arabic",
                )}
              >
                {site.bio}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {site.stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-card px-4 py-5 text-center shadow-sm"
                >
                  <p className="text-3xl font-semibold text-primary sm:text-4xl">{item.value}</p>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <h3
                className={cn(
                  "flex items-center gap-2 text-xl font-semibold text-foreground",
                  isRtl && "font-arabic",
                )}
              >
                <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
                {t("educationTitle")}
              </h3>

              {formal.length > 0 ? (
                <div>
                  <h4
                    className={cn(
                      "mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                      isRtl && "font-arabic",
                    )}
                  >
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden />
                    {t("educationFormalTitle")}
                  </h4>
                  <FormalEducationList items={formal} />
                </div>
              ) : null}

              {certificates.length + courses.length + trainings.length > 0 ? (
                <div className="space-y-8">
                  <EducationSubsection
                    title={t("educationCertificatesTitle")}
                    icon={<Award className="h-4 w-4 text-primary" aria-hidden />}
                    items={certificates}
                    typeLabel={educationTypeLabel}
                    isRtl={isRtl}
                  />
                  <EducationSubsection
                    title={t("educationCoursesTitle")}
                    icon={<Layers className="h-4 w-4 text-primary" aria-hidden />}
                    items={courses}
                    typeLabel={educationTypeLabel}
                    isRtl={isRtl}
                  />
                  <EducationSubsection
                    title={t("educationTrainingsTitle")}
                    icon={<Wrench className="h-4 w-4 text-primary" aria-hidden />}
                    items={trainings}
                    typeLabel={educationTypeLabel}
                    isRtl={isRtl}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <h3
                className={cn(
                  "mb-4 flex items-center gap-2 text-xl font-semibold text-foreground",
                  isRtl && "font-arabic",
                )}
              >
                <Heart className="h-5 w-5 text-primary" aria-hidden />
                {t("hobbiesTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {site.hobbies.map((hobby) => (
                  <span
                    key={hobby}
                    className="inline-flex rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm text-foreground/90"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
