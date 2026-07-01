import type { BlogPost, Project, SiteInfo } from "@/lib/data";
import { validateContactSubmissionsFile } from "@/lib/contact-submissions";
import { validateChatSessionsFile } from "@/lib/chat-sessions";
import {
  canPersistJson,
  getStorageMode,
  isEphemeralHosting,
  readDataJson,
  writeDataJson,
} from "@/lib/json-store";

export const CONTENT_KEYS = ["site", "projects", "blog", "contacts", "chats"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

const FILE_MAP: Record<ContentKey, string> = {
  site: "site.json",
  projects: "projects.json",
  blog: "blog-posts.json",
  contacts: "contact-submissions.json",
  chats: "chat-sessions.json",
};

export function isContentKey(value: string): value is ContentKey {
  return CONTENT_KEYS.includes(value as ContentKey);
}

export async function readContentFile(key: ContentKey): Promise<unknown> {
  return readDataJson(FILE_MAP[key]);
}

export async function writeContentFile(key: ContentKey, data: unknown): Promise<void> {
  await writeDataJson(FILE_MAP[key], data);
}

export type ContentData = {
  site: SiteInfo;
  projects: Project[];
  posts: BlogPost[];
};

export async function loadContentData(): Promise<ContentData> {
  const [siteRaw, projectsRaw, blogRaw] = await Promise.all([
    readContentFile("site"),
    readContentFile("projects"),
    readContentFile("blog"),
  ]);

  const site = siteRaw as SiteInfo;
  const projects = (projectsRaw as { projects: Project[] }).projects ?? [];
  const posts = (blogRaw as { posts: BlogPost[] }).posts ?? [];

  return { site, projects, posts };
}

export function validateContent(key: ContentKey, data: unknown): string | null {
  if (!data || typeof data !== "object") return "Content must be a JSON object";

  if (key === "site") {
    const site = data as SiteInfo;
    if (!site.email || !site.linkedin || !site.github) {
      return "Site info requires email, linkedin, and github";
    }
    return null;
  }

  if (key === "projects") {
    const wrapper = data as { projects?: unknown };
    if (!Array.isArray(wrapper.projects)) return "Projects file must have a projects array";
    return null;
  }

  if (key === "blog") {
    const wrapper = data as { posts?: unknown };
    if (!Array.isArray(wrapper.posts)) return "Blog file must have a posts array";
    return null;
  }

  if (key === "contacts") return validateContactSubmissionsFile(data);

  if (key === "chats") return validateChatSessionsFile(data);

  return null;
}

/** @deprecated Use canPersistJson from json-store */
export function isReadOnlyHosting(): boolean {
  return isEphemeralHosting() && !canPersistJson();
}

export { canPersistJson, getStorageMode, isEphemeralHosting };
