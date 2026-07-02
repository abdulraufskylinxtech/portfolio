import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

import { PROFILE_IMAGE_PUBLIC_PREFIX } from "@/lib/profile-images";
import { readContentFile, writeContentFile } from "@/lib/content-store";
import {
  canPersistJson,
  isEphemeralHosting,
  isGitHubStorageEnabled,
} from "@/lib/json-store";
import type { SiteInfo } from "@/lib/data";

export const PROFILE_IMAGE_DIR = "profile";
export { PROFILE_IMAGE_PUBLIC_PREFIX };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type GitHubFileResponse = {
  content?: string;
  sha?: string;
  message?: string;
};

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

function resolvePublicPath(relativePath: string): string {
  const resolved = path.resolve(PUBLIC_DIR, relativePath);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    throw new Error("Invalid public path");
  }
  return resolved;
}

async function readGitHubFileMeta(filePath: string): Promise<{ sha?: string }> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GitHub storage is not configured");

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);

  const body = (await res.json()) as GitHubFileResponse;
  return { sha: body.sha };
}

async function writeGitHubBinary(filePath: string, buffer: Buffer, sha?: string): Promise<void> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GitHub storage is not configured");

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: `chore: update ${filePath}`,
      content: buffer.toString("base64"),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as GitHubFileResponse;
    throw new Error(body.message || `GitHub write failed (${res.status})`);
  }
}

async function deleteGitHubFile(filePath: string): Promise<void> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GitHub storage is not configured");

  const meta = await readGitHubFileMeta(filePath);
  if (!meta.sha) return;

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: `chore: remove ${filePath}`,
      sha: meta.sha,
      branch: cfg.branch,
    }),
  });

  if (!res.ok && res.status !== 404) {
    const body = (await res.json().catch(() => ({}))) as GitHubFileResponse;
    throw new Error(body.message || `GitHub delete failed (${res.status})`);
  }
}

function extensionForFile(file: File): string {
  const fromName = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }

  switch (file.type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

function buildProfileImageFilename(file: File): string {
  const ext = extensionForFile(file);
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `photo-${stamp}-${rand}${ext}`;
}

export function validateProfileImageFile(file: File): string | null {
  const ext = extensionForFile(file);
  const allowedExt = new Set([".jpg", ".png", ".webp", ".gif"]);
  if (!ALLOWED_MIME.has(file.type) && !allowedExt.has(ext)) {
    return "Only JPG, PNG, WebP, or GIF images are allowed";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MB or smaller";
  return null;
}

export function isManagedProfileImageUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith(PROFILE_IMAGE_PUBLIC_PREFIX) && !trimmed.includes("..");
}

function profileImageUrlToRelativePath(url: string): string {
  const trimmed = url.trim().replace(/^\//, "");
  if (!trimmed.startsWith(`${PROFILE_IMAGE_DIR}/`) || trimmed.includes("..")) {
    throw new Error("Invalid profile image path");
  }
  return trimmed;
}

async function writeProfileImageFile(filename: string, buffer: Buffer): Promise<string> {
  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const relativePath = `${PROFILE_IMAGE_DIR}/${filename}`;
  const githubPath = `public/${relativePath}`;

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    await writeGitHubBinary(githubPath, buffer);
    return `/${relativePath}`;
  }

  const diskPath = resolvePublicPath(relativePath);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);
  return `/${relativePath}`;
}

export async function deleteProfileImageFile(url: string): Promise<void> {
  if (!isManagedProfileImageUrl(url)) return;

  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const relativePath = profileImageUrlToRelativePath(url);
  const githubPath = `public/${relativePath}`;

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    await deleteGitHubFile(githubPath);
    return;
  }

  const diskPath = resolvePublicPath(relativePath);
  await fs.unlink(diskPath).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
}

async function updateSiteProfileImage(profileImage: string | null): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const next: SiteInfo = { ...site };
  if (profileImage?.trim()) {
    next.profileImage = profileImage.trim();
  } else {
    delete next.profileImage;
  }
  await writeContentFile("site", next);
  return next;
}

export async function uploadProfileImage(file: File, buffer: Buffer): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const current = site.profileImage?.trim();

  if (current) {
    await deleteProfileImageFile(current);
  }

  const filename = buildProfileImageFilename(file);
  const publicUrl = await writeProfileImageFile(filename, buffer);
  return updateSiteProfileImage(publicUrl);
}

export async function removeProfileImage(): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const current = site.profileImage?.trim();

  if (current) {
    await deleteProfileImageFile(current);
  }

  return updateSiteProfileImage(null);
}
