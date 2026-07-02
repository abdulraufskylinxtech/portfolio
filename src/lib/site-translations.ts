import type { SiteInfo, SiteLocaleBundle, SiteStat } from "@/lib/data";
import { getHeroRoles } from "@/lib/data";
import {
  getDefaultLocaleCode,
  getEnabledLocales,
  getTranslatableLocaleCodes,
} from "@/lib/site-locales";
import { getLanguageNameForAi } from "@/lib/locale-catalog";
import { callLlmCompletion, getLlmConfig, parseJsonFromLlm } from "@/lib/llm-client";
import { readContentFile, writeContentFile } from "@/lib/content-store";
import {
  generateUiMessagesForLocale,
  saveUiMessagesForLocale,
} from "@/lib/ui-messages";

export type SiteTranslationMap = Record<string, SiteLocaleBundle>;

type TranslationSource = {
  name: string;
  role: string;
  bio: string;
  heroRoles: string[];
  availability: string;
  location: string;
  stats: SiteStat[];
  hobbies: string[];
};

function buildTranslationSource(site: SiteInfo): TranslationSource {
  return {
    name: site.name?.trim() || "Portfolio",
    role: site.role,
    bio: site.bio,
    heroRoles: getHeroRoles(site),
    availability: site.availability,
    location: site.location,
    stats: site.stats,
    hobbies: site.hobbies,
  };
}

function buildSystemPrompt(targetLanguage: string): string {
  return `You are a professional translator for portfolio websites.
Translate the given English portfolio content into ${targetLanguage}.
Rules:
- Preserve meaning and professional tone.
- Keep technology names (React, Node.js, TypeScript, etc.) in their common form for the target language.
- Do not invent new facts.
- Return ONLY valid JSON for a single locale object with keys: name, role, bio, heroRoles (array), availability, location, stats (array of {value, label}), hobbies (array of strings).
- Stat "value" fields must stay identical to the source; only translate stat labels.`;
}

function normalizeBundle(bundle: SiteLocaleBundle, source: TranslationSource): SiteLocaleBundle {
  return {
    name: bundle.name?.trim() || source.name,
    role: bundle.role?.trim() || source.role,
    bio: bundle.bio?.trim() || source.bio,
    heroRoles:
      bundle.heroRoles?.map((r) => r.trim()).filter(Boolean).length > 0
        ? bundle.heroRoles.map((r) => r.trim()).filter(Boolean)
        : source.heroRoles,
    availability: bundle.availability?.trim() || source.availability,
    location: bundle.location?.trim() || source.location,
    stats:
      bundle.stats?.length === source.stats.length
        ? bundle.stats.map((stat, i) => ({
            value: source.stats[i]?.value ?? stat.value,
            label: stat.label?.trim() || source.stats[i]?.label || stat.label,
          }))
        : source.stats,
    hobbies:
      bundle.hobbies?.map((h) => h.trim()).filter(Boolean).length > 0
        ? bundle.hobbies.map((h) => h.trim()).filter(Boolean)
        : source.hobbies,
  };
}

export async function generateTranslationForLocale(
  site: SiteInfo,
  localeCode: string,
): Promise<SiteLocaleBundle> {
  const llm = getLlmConfig();
  if (!llm) {
    throw new Error("AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env");
  }

  const defaultLocale = getDefaultLocaleCode(site);
  if (localeCode === defaultLocale) {
    throw new Error("The default language does not need AI translation");
  }

  const enabled = new Set(getEnabledLocales(site).map((locale) => locale.code));
  if (!enabled.has(localeCode)) {
    throw new Error(`Language "${localeCode}" is not enabled on this site`);
  }

  const source = buildTranslationSource(site);
  const languageName = getLanguageNameForAi(localeCode);
  const userPrompt = `Translate this portfolio content into ${languageName} (locale code: ${localeCode}):\n\n${JSON.stringify(source, null, 2)}`;

  const raw = await callLlmCompletion(llm, buildSystemPrompt(languageName), userPrompt, {
    temperature: 0.2,
    maxTokens: 2200,
  });

  const parsed = parseJsonFromLlm<SiteLocaleBundle>(raw);
  if (!parsed.role?.trim()) {
    throw new Error(`AI translation for ${languageName} was incomplete`);
  }

  return normalizeBundle(parsed, source);
}

async function generateFullLocalePack(
  site: SiteInfo,
  localeCode: string,
): Promise<SiteLocaleBundle> {
  const [content, ui] = await Promise.all([
    generateTranslationForLocale(site, localeCode),
    generateUiMessagesForLocale(localeCode, site),
  ]);
  await saveUiMessagesForLocale(localeCode, ui);
  return content;
}

export async function generateSiteTranslations(
  site: SiteInfo,
  localeCodes?: string[],
): Promise<SiteTranslationMap> {
  const targets =
    localeCodes?.length && localeCodes.length > 0
      ? localeCodes
      : getTranslatableLocaleCodes(site);

  const next: SiteTranslationMap = { ...(site.translations ?? {}) };

  for (const code of targets) {
    next[code] = await generateFullLocalePack(site, code);
  }

  return next;
}

export async function translateAndSaveSite(localeCodes?: string[]): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const generated = await generateSiteTranslations(site, localeCodes);
  const next: SiteInfo = {
    ...site,
    translations: {
      ...(site.translations ?? {}),
      ...generated,
    },
    translationsUpdatedAt: new Date().toISOString(),
  };
  await writeContentFile("site", next);
  return next;
}
