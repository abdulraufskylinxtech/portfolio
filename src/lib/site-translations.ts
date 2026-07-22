import type {
  BlogPost,
  BlogPostLocaleBundle,
  EducationEntry,
  ExperienceEntry,
  Project,
  ProjectLocaleBundle,
  SiteInfo,
  SiteLocaleBundle,
  SiteStat,
} from "@/lib/data";
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

type ExperienceTranslationSource = Pick<
  ExperienceEntry,
  "role" | "company" | "period" | "location" | "bullets"
>;

type EducationTranslationSource = Pick<
  EducationEntry,
  "degree" | "year" | "institution" | "type"
>;

type TranslationSource = {
  name: string;
  role: string;
  bio: string;
  heroRoles: string[];
  availability: string;
  location: string;
  stats: SiteStat[];
  hobbies: string[];
  experience: ExperienceTranslationSource[];
  education: EducationTranslationSource[];
};

type ProjectTranslationResponse = {
  title: string;
  description: string;
  apis: string[];
  highlights: string[];
};

type BlogTranslationResponse = {
  title: string;
  excerpt: string;
  content: string;
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
    experience: site.experience.map(({ role, company, period, location, bullets }) => ({
      role,
      company,
      period,
      location,
      bullets,
    })),
    education: site.education.map(({ degree, year, institution, type }) => ({
      degree,
      year,
      institution,
      type,
    })),
  };
}

function buildSystemPrompt(targetLanguage: string): string {
  return `You are a professional translator for a developer portfolio website.
Translate every human-readable value in the supplied JSON into ${targetLanguage}.
Rules:
- Return the SAME JSON object structure and preserve every array item in the same order.
- Translate name, role, bio, heroRoles, availability, location, stat labels, hobbies, experience roles/periods/locations/bullets, and education degrees/institutions.
- Keep company names, technology names, dates, stat values, education years, and education type codes unchanged.
- Preserve facts and professional tone. Do not summarize, omit, or invent content.
- Return ONLY valid JSON with no markdown wrapper.`;
}

function normalizeExperience(
  translated: ExperienceEntry[] | undefined,
  site: SiteInfo,
): ExperienceEntry[] {
  if (!translated || translated.length !== site.experience.length) return site.experience;
  return site.experience.map((source, index) => {
    const item = translated[index];
    return {
      ...source,
      role: item?.role?.trim() || source.role,
      company: source.company,
      period: item?.period?.trim() || source.period,
      location: item?.location?.trim() || source.location,
      bullets:
        item?.bullets?.length === source.bullets.length
          ? item.bullets.map((bullet, bulletIndex) => bullet?.trim() || source.bullets[bulletIndex])
          : source.bullets,
    };
  });
}

function normalizeEducation(
  translated: EducationEntry[] | undefined,
  site: SiteInfo,
): EducationEntry[] {
  if (!translated || translated.length !== site.education.length) return site.education;
  return site.education.map((source, index) => {
    const item = translated[index];
    return {
      ...source,
      degree: item?.degree?.trim() || source.degree,
      institution: item?.institution?.trim() || source.institution,
      year: source.year,
      type: source.type,
    };
  });
}

function normalizeBundle(
  bundle: SiteLocaleBundle,
  source: TranslationSource,
  site: SiteInfo,
): SiteLocaleBundle {
  return {
    name: bundle.name?.trim() || source.name,
    role: bundle.role?.trim() || source.role,
    bio: bundle.bio?.trim() || source.bio,
    heroRoles:
      bundle.heroRoles?.map((role) => role.trim()).filter(Boolean).length > 0
        ? bundle.heroRoles.map((role) => role.trim()).filter(Boolean)
        : source.heroRoles,
    availability: bundle.availability?.trim() || source.availability,
    location: bundle.location?.trim() || source.location,
    stats:
      bundle.stats?.length === source.stats.length
        ? bundle.stats.map((stat, index) => ({
            value: source.stats[index]?.value ?? stat.value,
            label: stat.label?.trim() || source.stats[index]?.label || stat.label,
          }))
        : source.stats,
    hobbies:
      bundle.hobbies?.map((hobby) => hobby.trim()).filter(Boolean).length > 0
        ? bundle.hobbies.map((hobby) => hobby.trim()).filter(Boolean)
        : source.hobbies,
    experience: normalizeExperience(bundle.experience, site),
    education: normalizeEducation(bundle.education, site),
    complete: false,
  };
}

function requireLlm() {
  const llm = getLlmConfig();
  if (!llm) {
    throw new Error("AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env");
  }
  return llm;
}

export async function generateTranslationForLocale(
  site: SiteInfo,
  localeCode: string,
): Promise<SiteLocaleBundle> {
  const llm = requireLlm();
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
  const userPrompt = `Translate this complete portfolio profile into ${languageName} (locale code: ${localeCode}):\n\n${JSON.stringify(source, null, 2)}`;
  const raw = await callLlmCompletion(llm, buildSystemPrompt(languageName), userPrompt, {
    temperature: 0.2,
    maxTokens: 6000,
  });

  const parsed = parseJsonFromLlm<SiteLocaleBundle>(raw);
  if (!parsed.role?.trim()) {
    throw new Error(`AI translation for ${languageName} was incomplete`);
  }
  return normalizeBundle(parsed, source, site);
}

async function generateProjectTranslation(
  project: Project,
  localeCode: string,
): Promise<ProjectLocaleBundle> {
  const llm = requireLlm();
  const languageName = getLanguageNameForAi(localeCode);
  const source = {
    title: project.title,
    description: project.description,
    apis: project.apis,
    highlights: project.highlights,
  };
  const systemPrompt = `Translate every human-readable value in this project JSON into ${languageName}.
Preserve technology/product names, API identifiers, facts, and array order. Do not summarize or omit text.
Return ONLY valid JSON with keys: title, description, apis, highlights.`;
  const raw = await callLlmCompletion(
    llm,
    systemPrompt,
    `Target locale: ${localeCode}\n\n${JSON.stringify(source, null, 2)}`,
    { temperature: 0.2, maxTokens: 3500 },
  );
  const parsed = parseJsonFromLlm<ProjectTranslationResponse>(raw);
  return {
    title: parsed.title?.trim() || project.title,
    description: parsed.description?.trim() || project.description,
    apis: parsed.apis?.length === project.apis.length ? parsed.apis : project.apis,
    highlights:
      parsed.highlights?.length === project.highlights.length
        ? parsed.highlights
        : project.highlights,
  };
}

async function generateBlogTranslation(
  post: BlogPost,
  localeCode: string,
): Promise<BlogPostLocaleBundle> {
  const llm = requireLlm();
  const languageName = getLanguageNameForAi(localeCode);
  const source = { title: post.title, excerpt: post.excerpt, content: post.content };
  const systemPrompt = `Translate every human-readable value in this blog JSON into ${languageName}.
Preserve Markdown structure, headings, lists, links, images, inline code, fenced code blocks, commands, URLs, and technology names.
Translate the full content without summarizing, shortening, or omitting any paragraph.
Return ONLY valid JSON with keys: title, excerpt, content.`;
  const raw = await callLlmCompletion(
    llm,
    systemPrompt,
    `Target locale: ${localeCode}\n\n${JSON.stringify(source, null, 2)}`,
    { temperature: 0.2, maxTokens: 6000 },
  );
  const parsed = parseJsonFromLlm<BlogTranslationResponse>(raw);
  return {
    title: parsed.title?.trim() || post.title,
    excerpt: parsed.excerpt?.trim() || post.excerpt,
    content: parsed.content?.trim() || post.content,
  };
}

async function translateAndSaveProjects(localeCode: string): Promise<void> {
  const wrapper = (await readContentFile("projects")) as { projects?: Project[] };
  const projects = wrapper.projects ?? [];
  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index];
    const translation = await generateProjectTranslation(project, localeCode);
    projects[index] = {
      ...project,
      translations: { ...(project.translations ?? {}), [localeCode]: translation },
    };
    await writeContentFile("projects", { ...wrapper, projects });
  }
}

async function translateAndSaveBlogPosts(localeCode: string): Promise<void> {
  const wrapper = (await readContentFile("blog")) as { posts?: BlogPost[] };
  const posts = wrapper.posts ?? [];
  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const translation = await generateBlogTranslation(post, localeCode);
    posts[index] = {
      ...post,
      translations: { ...(post.translations ?? {}), [localeCode]: translation },
    };
    await writeContentFile("blog", { ...wrapper, posts });
  }
}

async function generateFullLocalePack(
  site: SiteInfo,
  localeCode: string,
): Promise<SiteLocaleBundle> {
  const content = await generateTranslationForLocale(site, localeCode);
  const ui = await generateUiMessagesForLocale(localeCode, site);
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
  const sourceSite = (await readContentFile("site")) as SiteInfo;
  const targets =
    localeCodes?.length && localeCodes.length > 0
      ? localeCodes
      : getTranslatableLocaleCodes(sourceSite);
  let nextSite = sourceSite;

  for (const localeCode of targets) {
    const bundle = await generateFullLocalePack(sourceSite, localeCode);
    nextSite = {
      ...nextSite,
      translations: {
        ...(nextSite.translations ?? {}),
        [localeCode]: { ...bundle, complete: false },
      },
    };
    await writeContentFile("site", nextSite);

    await translateAndSaveProjects(localeCode);
    await translateAndSaveBlogPosts(localeCode);

    const completedAt = new Date().toISOString();
    nextSite = {
      ...nextSite,
      translations: {
        ...(nextSite.translations ?? {}),
        [localeCode]: { ...bundle, complete: true },
      },
      translationsUpdatedAt: completedAt,
    };
    await writeContentFile("site", nextSite);
  }

  return nextSite;
}
