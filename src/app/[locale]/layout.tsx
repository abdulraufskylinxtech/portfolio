import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
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
import { getSiteUrl } from "@/lib/site";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const base = getSiteUrl();

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        en: `${base}/en`,
        ar: `${base}/ar`,
        de: `${base}/de`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      url: `${base}/${locale}`,
      siteName: t("siteName"),
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
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale;
  const fontClass = locale === "ar" ? "font-arabic" : "";

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
