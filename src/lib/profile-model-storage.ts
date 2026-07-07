import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

import { PROFILE_IMAGE_DIR } from "@/lib/profile-image-storage";
import { readContentFile, writeContentFile } from "@/lib/content-store";
import {
  canPersistJson,
  isEphemeralHosting,
  isGitHubStorageEnabled,
} from "@/lib/json-store";
import type { SiteInfo } from "@/lib/data";

const MAX_MODEL_BYTES = 20 * 1024 * 1024;
const PUBLIC_DIR = path.join(process.cwd(), "public");

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
    throw new Error(body.message ?? `GitHub write failed (${res.status})`);
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
    throw new Error(`GitHub delete failed (${res.status})`);
  }
}

function buildModelFilename(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 40) || "profile";
  const id = randomBytes(4).toString("hex");
  return `model-${base}-${id}.glb`;
}

export function validateProfileModelFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".glb")) {
    return "Only .glb files are allowed (export from Blender as glTF Binary)";
  }
  if (file.size > MAX_MODEL_BYTES) return "3D model must be 20 MB or smaller";
  return null;
}

export function isManagedProfileModelUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith(`/${PROFILE_IMAGE_DIR}/`) && trimmed.endsWith(".glb") && !trimmed.includes("..");
}

function modelUrlToRelativePath(url: string): string {
  const trimmed = url.trim().replace(/^\//, "");
  if (!trimmed.startsWith(`${PROFILE_IMAGE_DIR}/`) || !trimmed.endsWith(".glb") || trimmed.includes("..")) {
    throw new Error("Invalid profile model path");
  }
  return trimmed;
}

async function writeModelFile(filename: string, buffer: Buffer): Promise<string> {
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

export async function deleteProfileModelFile(url: string): Promise<void> {
  if (!isManagedProfileModelUrl(url)) return;

  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const relativePath = modelUrlToRelativePath(url);
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

async function updateSiteProfileModel(profileModel: string | null): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const next: SiteInfo = { ...site };
  if (profileModel?.trim()) {
    next.profileModel = profileModel.trim();
  } else {
    delete next.profileModel;
  }
  await writeContentFile("site", next);
  return next;
}

export async function uploadProfileModel(file: File, buffer: Buffer): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const current = site.profileModel?.trim();

  if (current) {
    await deleteProfileModelFile(current);
  }

  const filename = buildModelFilename(file);
  const publicUrl = await writeModelFile(filename, buffer);
  return updateSiteProfileModel(publicUrl);
}

export async function removeProfileModel(): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const current = site.profileModel?.trim();

  if (current) {
    await deleteProfileModelFile(current);
  }

  return updateSiteProfileModel(null);
}
