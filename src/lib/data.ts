export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  apis: string[];
  highlights: string[];
  live_link: string | null;
  github_link: string | null;
  images: string[];
  published: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  post_type: string;
  featured_image_url: string | null;
  published: boolean;
  created_at: string;
}

export interface SiteStat {
  value: string;
  label: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  tech: string[];
  published: boolean;
}

export function isExperiencePublished(entry: ExperienceEntry): boolean {
  return entry.published !== false;
}

export type EducationType = "degree" | "certificate" | "course" | "training";

export interface EducationEntry {
  degree: string;
  year: string;
  institution: string;
  type: EducationType;
}

export interface SiteSkills {
  frontend: string[];
  backend: string[];
  devops: string[];
  aiml: string[];
}

export interface SiteMap {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
}

export interface SiteCv {
  url: string;
  filename: string;
  label?: string;
  uploadedAt?: string;
}

export type SiteLocaleCode = "en" | "ar" | "de";

/** Config for a language shown in the public language switcher. */
export interface SiteLocaleConfig {
  code: string;
  label: string;
  nativeName: string;
  flag: string;
}

/** Localized copy of hero/about text — stored per language (not the default source locale). */
export interface SiteLocaleBundle {
  name?: string;
  role: string;
  bio: string;
  heroRoles: string[];
  availability: string;
  location?: string;
  stats?: SiteStat[];
  hobbies?: string[];
}

export interface SiteInfo {
  /** Display name (navbar, hero, footer, metadata) */
  name: string;
  /** Optional Arabic display name — only used when useArabicDisplayName is true */
  nameAr?: string;
  /** When true, Arabic locale shows nameAr instead of name */
  useArabicDisplayName?: boolean;
  email: string;
  /** Phone for tel: links — falls back to whatsapp when empty */
  phone?: string;
  whatsapp?: string;
  linkedin: string;
  github: string;
  instagram?: string;
  location: string;
  bio: string;
  role: string;
  /** Rotating hero titles — falls back to splitting role by | or & */
  heroRoles?: string[];
  availability: string;
  aboutImages: string[];
  cv?: SiteCv | null;
  map?: SiteMap;
  stats: SiteStat[];
  skills: SiteSkills;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  hobbies: string[];
  /** Primary/source language code (usually en) */
  defaultLocale?: string;
  /** Languages available in the public switcher */
  enabledLocales?: SiteLocaleConfig[];
  /** AI-generated copies of hero/about text per locale code */
  translations?: Record<string, SiteLocaleBundle>;
  translationsUpdatedAt?: string;
}

export function getDisplayName(
  site: Pick<SiteInfo, "name" | "nameAr" | "useArabicDisplayName">,
  locale: string,
): string {
  const name = site.name?.trim() || "Portfolio";
  if (site.useArabicDisplayName && locale === "ar" && site.nameAr?.trim()) {
    return site.nameAr.trim();
  }
  return name;
}

export function getHeroRoles(site: Pick<SiteInfo, "role" | "heroRoles">): string[] {
  const fromList = site.heroRoles?.map((r) => r.trim()).filter(Boolean);
  if (fromList && fromList.length > 0) return fromList;

  const fromRole = site.role
    .split(/[|&]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return fromRole.length > 0 ? fromRole : [site.role];
}

export function getPhoneNumber(site: Pick<SiteInfo, "phone" | "whatsapp">): string | undefined {
  const phone = site.phone?.trim();
  if (phone) return phone;
  return site.whatsapp?.trim() || undefined;
}

import { getDefaultLocaleCode, isSourceLocale } from "@/lib/site-locales";

/** Merge AI/stored translations for the active locale (source locale uses top-level fields). */
export function resolveSiteForLocale(site: SiteInfo, locale: string): SiteInfo {
  if (isSourceLocale(site, locale)) return site;

  const tr = site.translations?.[locale];
  if (!tr) return site;

  return {
    ...site,
    name: tr.name?.trim() || site.name,
    role: tr.role || site.role,
    bio: tr.bio || site.bio,
    heroRoles: tr.heroRoles?.length ? tr.heroRoles : site.heroRoles,
    availability: tr.availability || site.availability,
    location: tr.location || site.location,
    stats: tr.stats?.length ? tr.stats : site.stats,
    hobbies: tr.hobbies?.length ? tr.hobbies : site.hobbies,
  };
}

export { getDefaultLocaleCode };
