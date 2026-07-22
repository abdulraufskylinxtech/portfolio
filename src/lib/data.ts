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
  translations?: Record<string, ProjectLocaleBundle>;
}

export interface ProjectLocaleBundle {
  title: string;
  description: string;
  apis: string[];
  highlights: string[];
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
  translations?: Record<string, BlogPostLocaleBundle>;
}

export interface BlogPostLocaleBundle {
  title: string;
  excerpt: string;
  content: string;
}

export interface SiteStat {
  value: string;
  label: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
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
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  complete?: boolean;
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
  /** Hero portrait photo (when no 3D model) */
  profileImage?: string;
  /** Optional .glb 3D model — shown on hero instead of photo when set */
  profileModel?: string;
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

export function getProfileImage(site: Pick<SiteInfo, "profileImage">): string | null {
  const image = site.profileImage?.trim();
  return image || null;
}

export function getProfileModel(site: Pick<SiteInfo, "profileModel">): string | null {
  const model = site.profileModel?.trim();
  return model || null;
}

/** Small avatar in navbar on scroll — first About section photo */
export function getNavbarAvatar(site: Pick<SiteInfo, "aboutImages">): string | null {
  const first = site.aboutImages?.map((src) => src.trim()).find(Boolean);
  return first || null;
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
  if (isSourceLocale(site, locale)) {
    return { ...site, name: getDisplayName(site, locale) };
  }

  const tr = site.translations?.[locale];
  if (!tr) return site;

  return {
    ...site,
    name: getDisplayName(site, locale),
    role: tr.role || site.role,
    bio: tr.bio || site.bio,
    heroRoles: tr.heroRoles?.length ? tr.heroRoles : site.heroRoles,
    availability: tr.availability || site.availability,
    location: tr.location || site.location,
    stats: tr.stats?.length ? tr.stats : site.stats,
    hobbies: tr.hobbies?.length ? tr.hobbies : site.hobbies,
    experience:
      tr.experience?.length === site.experience.length ? tr.experience : site.experience,
    education: tr.education?.length === site.education.length ? tr.education : site.education,
  };
}

export function resolveProjectForLocale(project: Project, locale: string): Project {
  const translation = project.translations?.[locale];
  if (!translation) return project;
  return {
    ...project,
    title: translation.title?.trim() || project.title,
    description: translation.description?.trim() || project.description,
    apis: translation.apis?.length ? translation.apis : project.apis,
    highlights: translation.highlights?.length ? translation.highlights : project.highlights,
  };
}

export function resolveBlogPostForLocale(post: BlogPost, locale: string): BlogPost {
  const translation = post.translations?.[locale];
  if (!translation) return post;
  return {
    ...post,
    title: translation.title?.trim() || post.title,
    excerpt: translation.excerpt?.trim() || post.excerpt,
    content: translation.content?.trim() || post.content,
  };
}

export { getDefaultLocaleCode };
