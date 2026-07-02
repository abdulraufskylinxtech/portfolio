"use client";

import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter as useIntlRouter, usePathname } from "@/i18n/navigation";
import { useSiteInfo } from "@/components/providers/content-provider";
import { getDefaultLocaleCode, getEnabledLocales } from "@/lib/site-locales";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useTransition } from "react";

const LOCALE_STORAGE_KEY = "portfolio-preferred-locale";

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const site = useSiteInfo();
  const pathname = usePathname();
  const router = useIntlRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const enabled = getEnabledLocales(site);
  const current = enabled.find((entry) => entry.code === locale) ?? enabled[0];

  const switchLocale = (target: string) => {
    if (target === locale) {
      setOpen(false);
      return;
    }
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, target);
    } catch {
      /* ignore */
    }
    startTransition(() => {
      router.replace(pathname, { locale: target });
    });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!current) return null;

  const others = enabled.filter((entry) => entry.code !== locale);
  const defaultLocale = getDefaultLocaleCode(site);

  return (
    <div ref={rootRef} className={cn("relative z-[60]", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border/60 bg-background/80 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-primary/45 hover:bg-background disabled:opacity-60",
          compact
            ? "h-9 w-9 shrink-0"
            : "min-h-[2.25rem] min-w-[7rem] justify-between gap-2 px-3 py-1.5 sm:min-w-[8rem]",
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", compact && "gap-0")}>
          <span aria-hidden>{current.flag}</span>
          {!compact ? <span>{current.nativeName}</span> : null}
        </span>
        {!compact ? (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-70 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute end-0 top-[calc(100%+6px)] z-[70] min-w-[11rem] overflow-hidden rounded-xl border border-white/15 bg-card py-1 shadow-xl backdrop-blur-md"
          role="listbox"
        >
          {others.map((entry) => (
            <button
              key={entry.code}
              type="button"
              role="option"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm font-medium text-foreground/90 transition hover:bg-primary/10 hover:text-primary"
              onClick={() => switchLocale(entry.code)}
            >
              <span aria-hidden>{entry.flag}</span>
              <span>
                {entry.nativeName}
                {entry.code === defaultLocale ? (
                  <span className="ms-1 text-xs text-muted-foreground">(source)</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
