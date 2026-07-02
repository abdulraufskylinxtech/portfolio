import type { SiteInfo } from "@/lib/data";
import { getCatalogEntry, LOCALE_CATALOG, type LocaleCatalogEntry } from "@/lib/locale-catalog";

export type SiteLocaleConfig = Pick<LocaleCatalogEntry, "code" | "label" | "nativeName" | "flag">;

const FALLBACK_ENABLED: SiteLocaleConfig[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "de", label: "German", nativeName: "Deutsch", flag: "🇩🇪" },
];

export function getDefaultLocaleCode(site: Pick<SiteInfo, "defaultLocale">): string {
  return site.defaultLocale?.trim() || "en";
}

export function getEnabledLocales(site: Pick<SiteInfo, "enabledLocales">): SiteLocaleConfig[] {
  if (site.enabledLocales?.length) {
    return site.enabledLocales.map((locale) => ({
      code: locale.code,
      label: locale.label,
      nativeName: locale.nativeName,
      flag: locale.flag,
    }));
  }
  return FALLBACK_ENABLED;
}

export function isSourceLocale(
  site: Pick<SiteInfo, "defaultLocale">,
  locale: string,
): boolean {
  return locale === getDefaultLocaleCode(site);
}

export function getTranslatableLocaleCodes(site: SiteInfo): string[] {
  const defaultLocale = getDefaultLocaleCode(site);
  return getEnabledLocales(site)
    .map((locale) => locale.code)
    .filter((code) => code !== defaultLocale);
}

export function catalogEntryToSiteLocale(code: string): SiteLocaleConfig {
  const entry = getCatalogEntry(code);
  if (!entry) {
    return { code, label: code.toUpperCase(), nativeName: code.toUpperCase(), flag: "🌐" };
  }
  return {
    code: entry.code,
    label: entry.label,
    nativeName: entry.nativeName,
    flag: entry.flag,
  };
}

export function getAddableLocales(site: Pick<SiteInfo, "enabledLocales">): LocaleCatalogEntry[] {
  const enabled = new Set(getEnabledLocales(site).map((locale) => locale.code));
  return LOCALE_CATALOG.filter((entry) => !enabled.has(entry.code));
}

export function addLocaleToSite(site: SiteInfo, code: string): SiteInfo {
  const enabled = getEnabledLocales(site);
  if (enabled.some((locale) => locale.code === code)) return site;
  return {
    ...site,
    enabledLocales: [...enabled, catalogEntryToSiteLocale(code)],
  };
}

export function removeLocaleFromSite(site: SiteInfo, code: string): SiteInfo {
  const defaultLocale = getDefaultLocaleCode(site);
  if (code === defaultLocale) return site;

  const enabled = getEnabledLocales(site).filter((locale) => locale.code !== code);
  const translations = { ...site.translations };
  delete translations[code];

  return {
    ...site,
    enabledLocales: enabled,
    translations,
  };
}
