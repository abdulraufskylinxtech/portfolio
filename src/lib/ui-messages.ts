import type { AbstractIntlMessages } from "next-intl";
import fs from "fs/promises";
import path from "path";

import { getLanguageNameForAi } from "@/lib/locale-catalog";
import { callLlmCompletion, getLlmConfig, parseJsonFromLlm } from "@/lib/llm-client";
import { readDataJson, writeDataJson } from "@/lib/json-store";
import {
  extractCodeRingsFromMessages,
  patchHeroCodeRings,
  resolveCodeRingsForLocale,
  translateCodeRingLabels,
} from "@/lib/code-ring-i18n";
import { getEnabledLocales } from "@/lib/site-locales";
import { getDisplayName, resolveSiteForLocale, type SiteInfo } from "@/lib/data";

import enMessages from "../../messages/en.json";

const BUILTIN_MESSAGE_LOCALES = new Set(["en", "ar", "de"]);

function uiMessagesPath(locale: string): string {
  return `ui-messages/${locale}.json`;
}

async function readGeneratedUiMessages(locale: string): Promise<AbstractIntlMessages | null> {
  try {
    const data = await readDataJson(uiMessagesPath(locale));
    if (data && typeof data === "object") {
      return data as AbstractIntlMessages;
    }
  } catch {
    /* not generated yet */
  }
  return null;
}

async function readBuiltinUiMessages(locale: string): Promise<AbstractIntlMessages | null> {
  if (!BUILTIN_MESSAGE_LOCALES.has(locale) || locale === "en") return null;
  try {
    return (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages;
  } catch {
    return null;
  }
}

function patchLanguageLabels(
  messages: AbstractIntlMessages,
  site?: SiteInfo,
): AbstractIntlMessages {
  if (!site) return messages;
  const enabled = getEnabledLocales(site);
  const language: Record<string, string> = {};
  for (const locale of enabled) {
    language[locale.code] = locale.nativeName;
  }
  return { ...messages, language };
}

function patchSiteIdentity(
  messages: AbstractIntlMessages,
  locale: string,
  site?: SiteInfo,
): AbstractIntlMessages {
  if (!site) return messages;

  const localizedSite = resolveSiteForLocale(site, locale);
  const displayName = getDisplayName(site, locale);
  const metadata = isPlainObject(messages.metadata) ? messages.metadata : {};
  const hero = isPlainObject(messages.hero) ? messages.hero : {};

  return {
    ...messages,
    metadata: {
      ...metadata,
      title: `${displayName} — ${localizedSite.role}`,
      siteName: `${displayName} Portfolio`,
      ogImageAlt: `${displayName} Portfolio`,
    },
    hero: {
      ...hero,
      name: displayName,
    },
  };
}

function finalizeUiMessages(
  messages: AbstractIntlMessages,
  locale: string,
  site?: SiteInfo,
): AbstractIntlMessages {
  return patchSiteIdentity(patchLanguageLabels(messages, site), locale, site);
}

function withLocalizedCodeRings(messages: AbstractIntlMessages, locale: string): AbstractIntlMessages {
  const fromMessages = extractCodeRingsFromMessages(messages);
  const codeRings = resolveCodeRingsForLocale(locale, fromMessages);
  return patchHeroCodeRings(messages, codeRings);
}

/** Load next-intl messages for a locale (generated AI file → built-in file → English). */
export async function loadUiMessages(
  locale: string,
  site?: SiteInfo,
): Promise<AbstractIntlMessages> {
  const english = enMessages as unknown as AbstractIntlMessages;

  if (locale === "en") {
    return finalizeUiMessages(english, locale, site);
  }

  const generated = await readGeneratedUiMessages(locale);
  if (generated) {
    const merged = deepMergeMessages(english, generated) as AbstractIntlMessages;
    return finalizeUiMessages(withLocalizedCodeRings(merged, locale), locale, site);
  }

  const builtin = await readBuiltinUiMessages(locale);
  if (builtin) {
    const merged = deepMergeMessages(english, builtin) as AbstractIntlMessages;
    return finalizeUiMessages(withLocalizedCodeRings(merged, locale), locale, site);
  }

  return finalizeUiMessages(withLocalizedCodeRings(english, locale), locale, site);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeMessages(base: unknown, translated: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(translated)) {
    return translated ?? base;
  }

  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    if (key in translated) {
      result[key] = deepMergeMessages(base[key], translated[key]);
    }
  }
  return result;
}

const UI_MESSAGES_SYSTEM = `You are a professional UI translator for portfolio websites.
You receive English UI JSON used by next-intl. Return the SAME JSON structure and keys.
Rules:
- Translate only human-readable string values.
- Keep JSON keys unchanged.
- Keep placeholders exactly as-is: {name}, {n}, {location}.
- Keep technology names natural in the target language (React, Node.js, etc.).
- hero.codeRingOuter and hero.codeRingInner are translated separately after this step — you may omit them or leave placeholders.
- Return ONLY valid JSON, no markdown.`;

export async function generateUiMessagesForLocale(
  localeCode: string,
  site: SiteInfo,
): Promise<AbstractIntlMessages> {
  const llm = getLlmConfig();
  if (!llm) {
    throw new Error("AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env");
  }

  const languageName = getLanguageNameForAi(localeCode);
  const userPrompt = `Translate all UI strings into ${languageName} (locale code: ${localeCode}).\n\n${JSON.stringify(enMessages, null, 2)}`;

  const raw = await callLlmCompletion(llm, UI_MESSAGES_SYSTEM, userPrompt, {
    temperature: 0.2,
    maxTokens: 4500,
  });

  const parsed = parseJsonFromLlm<AbstractIntlMessages>(raw);
  let merged = deepMergeMessages(enMessages, parsed) as AbstractIntlMessages;

  const codeRings = await translateCodeRingLabels(localeCode);
  merged = patchHeroCodeRings(merged, codeRings);

  return patchLanguageLabels(merged, site);
}

export async function saveUiMessagesForLocale(
  localeCode: string,
  messages: AbstractIntlMessages,
): Promise<void> {
  await writeDataJson(uiMessagesPath(localeCode), messages);

  if (process.env.VERCEL) return;

  const dir = path.join(process.cwd(), "data", "ui-messages");
  await fs.mkdir(dir, { recursive: true });
}

export async function hasGeneratedUiMessages(locale: string): Promise<boolean> {
  return (await readGeneratedUiMessages(locale)) !== null;
}
