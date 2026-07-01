"use client";

import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useSiteInfo } from "@/components/providers/content-provider";
import { getWhatsAppUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const iconLinkClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:text-primary hover:shadow-[0_4px_20px_hsl(var(--primary)/0.15)]";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const site = useSiteInfo();
  const year = new Date().getFullYear();
  const whatsappUrl = site.whatsapp ? getWhatsAppUrl(site.whatsapp, t("whatsappPrefill")) : null;

  const quickLinks = [
    { href: { pathname: "/", hash: "projects" } as const, label: t("projects") },
    { href: { pathname: "/", hash: "about" } as const, label: t("about") },
    { href: "/blog" as const, label: t("blog") },
    { href: { pathname: "/", hash: "contact" } as const, label: t("contact") },
  ];

  const socialIcons = [
    { href: `mailto:${site.email}`, label: "Email", icon: Mail, external: false },
    { href: site.linkedin, label: "LinkedIn", icon: Linkedin, external: true },
    { href: site.github, label: "GitHub", icon: Github, external: true },
    ...(site.instagram
      ? [{ href: site.instagram, label: "Instagram", icon: Instagram, external: true }]
      : []),
  ];

  return (
    <footer className="relative mt-auto border-t border-border/60 bg-gradient-to-b from-card/30 to-background">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr_17rem] lg:items-start lg:gap-10">
          <div>
            <p
              className={cn(
                "text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent",
                locale === "ar" && "font-arabic text-2xl",
              )}
            >
              {locale === "ar" ? "شكيل لطيف" : "Shakeel Latif"}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{site.role}</p>
            <p className="mt-2 inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {site.location}
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("quickLinks")}
            </p>
            <nav className="flex flex-col gap-3" aria-label="Footer">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex w-fit items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-primary"
                >
                  <span className="h-px w-0 bg-primary transition-all group-hover:w-3" aria-hidden />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="w-full max-w-[17rem] lg:justify-self-end">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-[0_8px_32px_hsl(var(--primary)/0.06)] backdrop-blur-sm">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t("connect")}
              </p>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(37,211,102,0.35)] transition hover:bg-[#20bd5a] hover:shadow-[0_6px_24px_rgba(37,211,102,0.45)]"
                  data-cursor-hover
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  {t("whatsapp")}
                </a>
              ) : null}

              <div
                className={cn(
                  "mt-3 grid w-full gap-2",
                  socialIcons.length === 4 ? "grid-cols-4" : "grid-cols-3",
                )}
              >
                {socialIcons.map(({ href, label, icon: Icon, external }) => (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className={cn(iconLinkClass, "mx-auto w-full max-w-[2.75rem]")}
                    aria-label={label}
                    data-cursor-hover
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
          <p>
            © {year} Shakeel Latif. {t("rights")}
          </p>
          <p>{t("availability")}</p>
        </div>
      </div>
    </footer>
  );
}
