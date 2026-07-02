export type LocaleCatalogEntry = {
  code: string;
  label: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
};

/** Languages admins can add from the CMS (also registered in Next.js routing). */
export const LOCALE_CATALOG: LocaleCatalogEntry[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  { code: "de", label: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "it", label: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "ur", label: "Urdu", nativeName: "اردو", flag: "🇵🇰", rtl: true },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "sv", label: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "id", label: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "fa", label: "Persian", nativeName: "فارسی", flag: "🇮🇷", rtl: true },
  { code: "he", label: "Hebrew", nativeName: "עברית", flag: "🇮🇱", rtl: true },
];

export const ROUTING_LOCALE_CODES = LOCALE_CATALOG.map((entry) => entry.code);

export function getCatalogEntry(code: string): LocaleCatalogEntry | undefined {
  return LOCALE_CATALOG.find((entry) => entry.code === code);
}

export function isRtlLocale(code: string): boolean {
  return getCatalogEntry(code)?.rtl === true;
}

export function getLanguageNameForAi(code: string): string {
  const entry = getCatalogEntry(code);
  if (!entry) return code;
  return `${entry.label} (${entry.nativeName})`;
}
