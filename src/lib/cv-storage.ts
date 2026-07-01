import fs from "fs/promises";
import path from "path";

import { readContentFile, writeContentFile } from "@/lib/content-store";
import {
  canPersistJson,
  isEphemeralHosting,
  isGitHubStorageEnabled,
} from "@/lib/json-store";
import type { SiteCv, SiteInfo } from "@/lib/data";

export const CV_RELATIVE_PATH = "cv/resume.pdf";
export const CV_PUBLIC_URL = "/cv/resume.pdf";
const MAX_CV_BYTES = 5 * 1024 * 1024;

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

export function validateCvFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are allowed";
  if (file.size > MAX_CV_BYTES) return "CV must be 5 MB or smaller";
  return null;
}

export async function writeCvFile(buffer: Buffer): Promise<void> {
  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const githubPath = `public/${CV_RELATIVE_PATH}`;

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    const existing = await readGitHubFileMeta(githubPath);
    await writeGitHubBinary(githubPath, buffer, existing.sha);
    return;
  }

  const diskPath = resolvePublicPath(CV_RELATIVE_PATH);
  await fs.mkdir(path.dirname(diskPath), { recursive: true });
  await fs.writeFile(diskPath, buffer);
}

export async function deleteCvFile(): Promise<void> {
  if (!canPersistJson()) {
    throw new Error("Storage unavailable. Configure GitHub env on serverless hosting.");
  }

  const githubPath = `public/${CV_RELATIVE_PATH}`;

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    await deleteGitHubFile(githubPath);
    return;
  }

  const diskPath = resolvePublicPath(CV_RELATIVE_PATH);
  await fs.unlink(diskPath).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
}

export async function updateSiteCv(cv: SiteCv | null): Promise<SiteInfo> {
  const site = (await readContentFile("site")) as SiteInfo;
  const next: SiteInfo = { ...site, cv: cv ?? undefined };
  if (!cv) delete next.cv;
  await writeContentFile("site", next);
  return next;
}

export function buildCvMeta(filename: string): SiteCv {
  return {
    url: CV_PUBLIC_URL,
    filename: filename.replace(/[^\w.\-() ]+/g, "_") || "resume.pdf",
    uploadedAt: new Date().toISOString(),
  };
}
