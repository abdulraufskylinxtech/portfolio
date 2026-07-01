import fs from "fs/promises";
import path from "path";

import { readContentFile, writeContentFile } from "@/lib/content-store";
import {
  canPersistJson,
  isEphemeralHosting,
  isGitHubStorageEnabled,
} from "@/lib/json-store";
import type { SiteInfo } from "@/lib/data";

export const PROFILE_DIR = "profile";
export const PROFILE_PUBLIC_DIR = "/profile";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

function safeImageFilename(originalName: string, baseName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const normalizedExt = ALLOWED_IMAGE_EXT.has(ext) ? ext : ".jpg";
  return `${baseName}${normalizedExt}`;
}

function publicUrlFor(relativePath: string): string {
  return `/${relativePath.replace(/^\/+/, "")}`;
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

async function writePublicBinary(relativePath: string, buffer: Buffer): Promise<void> {
  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const githubPath = `public/${relativePath}`;

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    const existing = await readGitHubFileMeta(githubPath);
    await writeGitHubBinary(githubPath, buffer, existing.sha);
    return;
  }

  const diskPath = resolvePublicPath(relativePath);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = path.extname(file.name).toLowerCase();
  return ALLOWED_IMAGE_EXT.has(ext);
}

export function validateProfileImageFile(file: File): string | null {
  if (!isImageFile(file)) return "Only JPG, PNG, or WebP images are allowed";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 3 MB or smaller";
  return null;
}

export function validateDepthMapFile(file: File): string | null {
  if (!isImageFile(file)) return "Only JPG, PNG, or WebP depth images are allowed";
  if (file.size > MAX_IMAGE_BYTES) return "Depth map must be 3 MB or smaller";
  return null;
}

export async function writeProfileImageFile(
  buffer: Buffer,
  originalFilename: string,
): Promise<string> {
  const filename = safeImageFilename(originalFilename, "avatar");
  const relativePath = `${PROFILE_DIR}/${filename}`;
  await writePublicBinary(relativePath, buffer);
  return publicUrlFor(relativePath);
}

export async function writeDepthMapFile(buffer: Buffer, originalFilename: string): Promise<string> {
  const filename = safeImageFilename(originalFilename, "depth");
  const relativePath = `${PROFILE_DIR}/${filename}`;
  await writePublicBinary(relativePath, buffer);
  return publicUrlFor(relativePath);
}

export async function updateSiteProfileFields(
  patch: Partial<Pick<SiteInfo, "profileImage" | "profileDepthMap">>,
): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const next: SiteInfo = { ...site, ...patch };
  await writeContentFile("site", next);
  return next;
}
