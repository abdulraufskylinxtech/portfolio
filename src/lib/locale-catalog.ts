export type LocaleCatalogEntry = {
  code: string;
  label: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
};

const ISO_639_1_CODES = [
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce",
  "ch", "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee",
  "el", "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr",
  "fy", "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr",
  "ht", "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is",
  "it", "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn",
  "ko", "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln",
  "lo", "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms",
  "mt", "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv",
  "ny", "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu",
  "rm", "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk",
  "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta",
  "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw",
  "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi",
  "yo", "za", "zh", "zu",
] as const;

const FLAG_BY_LANGUAGE: Record<string, string> = {
  af: "🇿🇦", am: "🇪🇹", ar: "🇸🇦", az: "🇦🇿", be: "🇧🇾", bg: "🇧🇬",
  bn: "🇧🇩", bs: "🇧🇦", ca: "🇪🇸", cs: "🇨🇿", cy: "🇬🇧", da: "🇩🇰",
  de: "🇩🇪", dv: "🇲🇻", dz: "🇧🇹", el: "🇬🇷", en: "🇬🇧", es: "🇪🇸",
  et: "🇪🇪", eu: "🇪🇸", fa: "🇮🇷", fi: "🇫🇮", fj: "🇫🇯", fo: "🇫🇴",
  fr: "🇫🇷", ga: "🇮🇪", gd: "🇬🇧", gl: "🇪🇸", gu: "🇮🇳", ha: "🇳🇬",
  he: "🇮🇱", hi: "🇮🇳", hr: "🇭🇷", ht: "🇭🇹", hu: "🇭🇺", hy: "🇦🇲",
  id: "🇮🇩", ig: "🇳🇬", is: "🇮🇸", it: "🇮🇹", ja: "🇯🇵", jv: "🇮🇩",
  ka: "🇬🇪", kk: "🇰🇿", km: "🇰🇭", kn: "🇮🇳", ko: "🇰🇷", ku: "🌐",
  ky: "🇰🇬", lo: "🇱🇦", lt: "🇱🇹", lv: "🇱🇻", mi: "🇳🇿", mk: "🇲🇰",
  ml: "🇮🇳", mn: "🇲🇳", mr: "🇮🇳", ms: "🇲🇾", mt: "🇲🇹", my: "🇲🇲",
  nb: "🇳🇴", ne: "🇳🇵", nl: "🇳🇱", nn: "🇳🇴", no: "🇳🇴", pa: "🇮🇳",
  pl: "🇵🇱", ps: "🇦🇫", pt: "🇵🇹", ro: "🇷🇴", ru: "🇷🇺", sd: "🇵🇰",
  si: "🇱🇰", sk: "🇸🇰", sl: "🇸🇮", so: "🇸🇴", sq: "🇦🇱", sr: "🇷🇸",
  sv: "🇸🇪", sw: "🇹🇿", ta: "🇮🇳", te: "🇮🇳", tg: "🇹🇯", th: "🇹🇭",
  tk: "🇹🇲", tl: "🇵🇭", tr: "🇹🇷", ug: "🌐", uk: "🇺🇦", ur: "🇵🇰",
  uz: "🇺🇿", vi: "🇻🇳", xh: "🇿🇦", yi: "🌐", yo: "🇳🇬", zh: "🇨🇳",
  zu: "🇿🇦",
};

const RTL_LOCALES = new Set(["ar", "dv", "fa", "he", "ps", "sd", "ug", "ur", "yi"]);

function languageName(code: string, displayLocale: string): string {
  try {
    return new Intl.DisplayNames([displayLocale], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Complete ISO 639-1 catalog available to the CMS and Next.js routing. */
export const LOCALE_CATALOG: LocaleCatalogEntry[] = ISO_639_1_CODES.map((code) => ({
  code,
  label: languageName(code, "en"),
  nativeName: languageName(code, code),
  flag: FLAG_BY_LANGUAGE[code] ?? "🌐",
  rtl: RTL_LOCALES.has(code) || undefined,
})).sort((first, second) => first.label.localeCompare(second.label));

export const ROUTING_LOCALE_CODES = ISO_639_1_CODES;

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
