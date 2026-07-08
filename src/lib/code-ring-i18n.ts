import type { AbstractIntlMessages } from "next-intl";

import { getLanguageNameForAi, isRtlLocale } from "@/lib/locale-catalog";
import { callLlmCompletion, getLlmConfig, parseJsonFromLlm } from "@/lib/llm-client";

/** Fixed hero portrait stack — English is the source of truth for generation. */
export const CODE_RING_OUTER_ITEMS = [
  "Python",
  "PyTorch",
  "Ollama",
  "FastAPI",
  "Docker",
  "Redis",
] as const;

export const CODE_RING_INNER_ITEMS = [
  "AWS",
  "Azure",
  "Git",
  "GitHub",
  "RAG",
  "MCP",
] as const;

export type CodeRingStrings = {
  codeRingOuter: string;
  codeRingInner: string;
};

export function formatCodeRingString(raw: string): string {
  const parts = raw
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? ` ${parts.join(" · ")} · ` : raw;
}

export function formatCodeRings(outer: readonly string[], inner: readonly string[]): CodeRingStrings {
  return {
    codeRingOuter: formatCodeRingString(outer.join(" · ")),
    codeRingInner: formatCodeRingString(inner.join(" · ")),
  };
}

export function getEnglishCodeRings(): CodeRingStrings {
  return formatCodeRings(CODE_RING_OUTER_ITEMS, CODE_RING_INNER_ITEMS);
}

/** Locales where orbit labels must not contain Latin (A–Z) letters. */
export function requiresFullyLocalizedCodeRings(locale: string): boolean {
  if (locale === "en") return false;
  if (isRtlLocale(locale)) return true;
  return ["zh", "ja", "ko", "hi", "ru", "th", "bn"].includes(locale);
}

export function codeRingsMatchEnglish(rings: CodeRingStrings): boolean {
  const en = getEnglishCodeRings();
  return (
    rings.codeRingOuter.trim() === en.codeRingOuter.trim() &&
    rings.codeRingInner.trim() === en.codeRingInner.trim()
  );
}

export function codeRingsContainLatinLabels(rings: CodeRingStrings): boolean {
  return /[A-Za-z]/.test(`${rings.codeRingOuter}${rings.codeRingInner}`);
}

/** Curated full localizations (no Latin letters in label text). */
export const BUILTIN_CODE_RINGS: Partial<Record<string, CodeRingStrings>> = {
  ar: formatCodeRings(
    ["بايثون", "بايتورش", "أولاما", "فاست أي بي آي", "دوكر", "ريديس"],
    ["أمازون", "أزور", "جيت", "جيت هاب", "راغ", "إم سي بي"],
  ),
  ur: formatCodeRings(
    ["پائتھن", "پائتورچ", "اولاما", "فاسٹ اے پی آئی", "ڈاکر", "ریڈس"],
    ["اے ڈبلیو ایس", "ازور", "گٹ", "گٹ ہب", "ریگ", "ایم سی پی"],
  ),
  fa: formatCodeRings(
    ["پایتون", "پایتورچ", "اولاما", "فست ای پی آی", "داکر", "ردیس"],
    ["آمازون", "آژور", "گیت", "گیت‌هاب", "رگ", "ام سی پی"],
  ),
  he: formatCodeRings(
    ["פייתון", "פייטורש", "אולама", "פаст איי פי איי", "דוקר", "רדיס"],
    ["אמזון", "אזור", "גיט", "גיטהאב", "ראג", "אם סי פי"],
  ),
  zh: formatCodeRings(
    ["派森", "派托奇", "奥拉马", "迅捷接口", "多克", "雷迪斯"],
    ["亚马逊", "微软云", "吉特", "吉特哈布", "检索", "协议"],
  ),
  hi: formatCodeRings(
    ["पाइथन", "पायटोर्च", "ओलामा", "फास्ट एपीआई", "डॉकर", "रेडिस"],
    ["अमेज़न", "अज़्योर", "गिट", "गिटहब", "रैग", "एमसीपी"],
  ),
  ru: formatCodeRings(
    ["Питон", "Пайторч", "Олама", "ФастАПИ", "Докер", "Редис"],
    ["АВС", "Азур", "Гит", "ГитХаб", "РАГ", "МЦП"],
  ),
  ja: formatCodeRings(
    ["パイソン", "パイトーチ", "オラマ", "ファストエーピーアイ", "ドッカー", "レディス"],
    ["アマゾン", "アジュール", "ギット", "ギットハブ", "ラグ", "エムシーピー"],
  ),
  ko: formatCodeRings(
    ["파이썬", "파이토치", "올라마", "패스트에이피아이", "도커", "레디스"],
    ["아마존", "애저", "깃", "깃허브", "랙", "엠시피"],
  ),
};

function buildCodeRingTranslationSystem(localeCode: string, languageName: string): string {
  const strict = requiresFullyLocalizedCodeRings(localeCode)
    ? `CRITICAL: Write EVERY label in ${languageName} native script only. Do NOT use any Latin/English letters (A-Z, a-z). Transliterate all brands phonetically (Python, AWS, GitHub, FastAPI, etc.).`
    : `Write labels naturally for ${languageName}. International tech brands may keep common Latin spellings.`;

  return `You translate tech stack labels on a rotating portrait ring.
Return ONLY valid JSON: {"codeRingOuter":"...","codeRingInner":"..."}

Fixed stack (12 items, do not add/remove):
Outer (6): ${CODE_RING_OUTER_ITEMS.join(", ")}
Inner (6): ${CODE_RING_INNER_ITEMS.join(", ")}

${strict}

Format: middle dot · between labels, same count as English (6 outer, 6 inner).
Example Arabic (zero Latin letters):
{"codeRingOuter":"بايثون · بايتورش · أولاما · فاست أي بي آي · دوكر · ريديس ·","codeRingInner":"أمازون · أزور · جيت · جيت هاب · راغ · إم سي بي ·"}`;
}

export async function translateCodeRingLabels(localeCode: string): Promise<CodeRingStrings> {
  if (localeCode === "en") {
    return getEnglishCodeRings();
  }

  const llm = getLlmConfig();
  if (!llm) {
    throw new Error("AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env");
  }

  const en = getEnglishCodeRings();
  const languageName = getLanguageNameForAi(localeCode);
  const system = buildCodeRingTranslationSystem(localeCode, languageName);
  const userPrompt = `Target locale: ${localeCode} (${languageName})
English outer: ${en.codeRingOuter.trim()}
English inner: ${en.codeRingInner.trim()}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callLlmCompletion(llm, system, userPrompt, {
        temperature: 0.15,
        maxTokens: 600,
      });
      const parsed = parseJsonFromLlm<CodeRingStrings>(raw);
      if (!parsed.codeRingOuter?.trim() || !parsed.codeRingInner?.trim()) {
        throw new Error("Incomplete code ring translation");
      }

      const rings: CodeRingStrings = {
        codeRingOuter: formatCodeRingString(parsed.codeRingOuter),
        codeRingInner: formatCodeRingString(parsed.codeRingInner),
      };

      if (requiresFullyLocalizedCodeRings(localeCode) && codeRingsContainLatinLabels(rings)) {
        throw new Error("Code ring translation still contains Latin letters");
      }

      return rings;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  const fallback = BUILTIN_CODE_RINGS[localeCode];
  if (fallback) {
    return fallback;
  }

  throw lastError ?? new Error(`Failed to translate code rings for ${localeCode}`);
}

export function extractCodeRingsFromMessages(messages: AbstractIntlMessages): CodeRingStrings | null {
  const hero = messages.hero;
  if (!hero || typeof hero !== "object") return null;
  const record = hero as Record<string, unknown>;
  const outer = record.codeRingOuter;
  const inner = record.codeRingInner;
  if (typeof outer !== "string" || typeof inner !== "string") return null;
  return { codeRingOuter: outer, codeRingInner: inner };
}

/** Pick the best localized code rings when loading or switching locale. */
export function resolveCodeRingsForLocale(
  locale: string,
  fromMessages?: CodeRingStrings | null,
): CodeRingStrings {
  if (locale === "en") {
    return getEnglishCodeRings();
  }

  const builtin = BUILTIN_CODE_RINGS[locale];

  if (requiresFullyLocalizedCodeRings(locale)) {
    if (fromMessages && !codeRingsContainLatinLabels(fromMessages)) {
      return fromMessages;
    }
    if (builtin) {
      return builtin;
    }
    if (fromMessages) {
      return fromMessages;
    }
    return getEnglishCodeRings();
  }

  if (fromMessages && !codeRingsMatchEnglish(fromMessages)) {
    return fromMessages;
  }
  if (builtin) {
    return builtin;
  }
  if (fromMessages) {
    return fromMessages;
  }

  return getEnglishCodeRings();
}

export function patchHeroCodeRings(
  messages: AbstractIntlMessages,
  codeRings: CodeRingStrings,
): AbstractIntlMessages {
  const hero = messages.hero;
  if (!hero || typeof hero !== "object") return messages;
  return {
    ...messages,
    hero: {
      ...(hero as Record<string, unknown>),
      ...codeRings,
    },
  };
}
