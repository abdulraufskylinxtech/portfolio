"use client";

import { createContext, useContext } from "react";

import type { BlogPost, Project, SiteInfo } from "@/lib/data";

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

export function usePublishedProjects(): Project[] {
  return useContent().projects.filter((project) => project.published);
}

export function usePublishedBlogPosts(): BlogPost[] {
  return useContent()
    .posts.filter((post) => post.published)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export function useProjectBySlug(slug: string): Project | undefined {
  return usePublishedProjects().find((project) => project.slug === slug);
}

export function useBlogPostBySlug(slug: string): BlogPost | undefined {
  return usePublishedBlogPosts().find((post) => post.slug === slug);
}
