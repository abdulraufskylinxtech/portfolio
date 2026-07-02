import type { SiteInfo, SiteLocaleBundle, SiteLocaleCode, SiteStat } from "@/lib/data";
import { getHeroRoles } from "@/lib/data";
import { callLlmCompletion, getLlmConfig, parseJsonFromLlm } from "@/lib/llm-client";
import { readContentFile, writeContentFile } from "@/lib/content-store";

export type SiteTranslationMap = Partial<Record<Exclude<SiteLocaleCode, "en">, SiteLocaleBundle>>;

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

const SYSTEM_PROMPT = `You are a professional translator for portfolio websites.
Translate the given English portfolio content into Arabic and German.
Rules:
- Preserve meaning and professional tone.
- Keep technology names (React, Node.js, TypeScript, etc.) in their common form for each language.
- Do not invent new facts.
- Return ONLY valid JSON with exactly two keys: "ar" and "de".
- Each locale object must include: name, role, bio, heroRoles (array), availability, location, stats (array of {value, label}), hobbies (array of strings).
- Stat "value" fields must stay identical to the source; only translate stat labels.`;

export async function generateSiteTranslations(
  site: SiteInfo,
): Promise<SiteTranslationMap> {
  const llm = getLlmConfig();
  if (!llm) {
    throw new Error("AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env");
  }

  const source = buildTranslationSource(site);
  const userPrompt = `Translate this portfolio content:\n\n${JSON.stringify(source, null, 2)}`;

  const raw = await callLlmCompletion(llm, SYSTEM_PROMPT, userPrompt, {
    temperature: 0.2,
    maxTokens: 3000,
  });

  const parsed = parseJsonFromLlm<{ ar: SiteLocaleBundle; de: SiteLocaleBundle }>(raw);

  if (!parsed.ar?.role || !parsed.de?.role) {
    throw new Error("AI translation response was missing Arabic or German content");
  }

  return {
    ar: normalizeBundle(parsed.ar, source),
    de: normalizeBundle(parsed.de, source),
  };
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

export async function translateAndSaveSite(): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const translations = await generateSiteTranslations(site);
  const next: SiteInfo = {
    ...site,
    translations,
    translationsUpdatedAt: new Date().toISOString(),
  };
  await writeContentFile("site", next);
  return next;
}
