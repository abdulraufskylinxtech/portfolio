"use client";

import { createContext, useContext, useMemo } from "react";
import { useLocale } from "next-intl";

import type { BlogPost, Project, SiteInfo } from "@/lib/data";
import {
  resolveBlogPostForLocale,
  resolveProjectForLocale,
  resolveSiteForLocale,
} from "@/lib/data";

export type ContentData = {
  site: SiteInfo;
  projects: Project[];
  posts: BlogPost[];
};

const ContentContext = createContext<ContentData | null>(null);

export function ContentProvider({
  data,
  children,
}: {
  data: ContentData;
  children: React.ReactNode;
}) {
  return <ContentContext.Provider value={data}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentData {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return ctx;
}

export function useSiteInfo(): SiteInfo {
  return useContent().site;
}

/** Site copy resolved for the active locale (AI translations for ar/de). */
export function useLocalizedSite(): SiteInfo {
  const site = useSiteInfo();
  const locale = useLocale();
  return useMemo(() => resolveSiteForLocale(site, locale), [site, locale]);
}

export function usePublishedProjects(): Project[] {
  const { projects } = useContent();
  const locale = useLocale();
  return useMemo(
    () => projects.filter((project) => project.published).map((project) => resolveProjectForLocale(project, locale)),
    [locale, projects],
  );
}

export function usePublishedBlogPosts(): BlogPost[] {
  const { posts } = useContent();
  const locale = useLocale();
  return useMemo(
    () =>
      posts
        .filter((post) => post.published)
        .map((post) => resolveBlogPostForLocale(post, locale))
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [locale, posts],
  );
}

export function useProjectBySlug(slug: string): Project | undefined {
  return usePublishedProjects().find((project) => project.slug === slug);
}

export function useBlogPostBySlug(slug: string): BlogPost | undefined {
  return usePublishedBlogPosts().find((post) => post.slug === slug);
}
