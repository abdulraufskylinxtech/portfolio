import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ContentProvider } from "@/components/providers/content-provider";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { routing } from "@/i18n/routing";
import { loadContentData } from "@/lib/content-store";
import { resolveSiteForLocale } from "@/lib/data";
import { isRtlLocale } from "@/lib/locale-catalog";
import { getEnabledLocales } from "@/lib/site-locales";
import { getSiteUrl } from "@/lib/site";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  const { site } = await loadContentData();
  return getEnabledLocales(site).map((locale) => ({ locale: locale.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { site: rawSite } = await loadContentData();
  const site = resolveSiteForLocale(rawSite, locale);
  const base = getSiteUrl();
  const title = `${site.name} — ${site.role}`;
  const description = site.bio;
  const enabled = getEnabledLocales(rawSite);
  const languages = Object.fromEntries(
    enabled.map((entry) => [entry.code, `${base}/${entry.code}`]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}`,
      languages,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${base}/${locale}`,
      siteName: `${site.name} Portfolio`,
      locale: locale === "ar" ? "ar_SA" : locale === "de" ? "de_DE" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  noStore();
  const [messages, content] = await Promise.all([getMessages(), loadContentData()]);
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const lang = locale;
  const fontClass = locale === "ar" || locale === "ur" || locale === "fa" ? "font-arabic" : "";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ContentProvider data={content}>
        <div lang={lang} dir={dir} className={`flex min-h-screen flex-col ${fontClass}`}>
          <CustomCursor />
          <Navbar />
          {children}
          <Footer />
        </div>
      </ContentProvider>
    </NextIntlClientProvider>
  );
}
