"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocalizedSite } from "@/components/providers/content-provider";
import { getMapDirectionsUrl, getMapEmbedUrl } from "@/lib/map";
import { cn } from "@/lib/utils";

type ContactMapProps = {
  className?: string;
};

export function ContactMap({ className }: ContactMapProps) {
  const t = useTranslations("contact.map");
  const site = useLocalizedSite();

  if (!site.map) return null;

  const label = site.map.label ?? site.location;
  const embedUrl = getMapEmbedUrl(site.map);
  const directionsUrl = getMapDirectionsUrl(site.map);

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <MapPin className="h-5 w-5 text-primary" aria-hidden />
        {t("title")}
      </h2>

      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/95 shadow-[0_10px_40px_rgba(15,23,42,0.08)]",
          "transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.12)]",
        )}
      >
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
          <iframe
            title={t("aria", { location: label })}
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0 grayscale-[20%] contrast-[1.05] transition duration-500 group-hover:grayscale-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"
            aria-hidden
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 bg-card/95 p-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:absolute sm:inset-x-0 sm:bottom-0 sm:border-t-0 sm:bg-transparent sm:p-4">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-primary/30 bg-background/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm sm:px-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary backdrop-blur-sm transition hover:bg-primary/20 sm:px-4"
          >
            {t("directions")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {site.location}
        {site.availability ? ` — ${site.availability}` : null}
      </p>
    </div>
  );
}
