import fs from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_PREFIXES = ["profile/", "about/"];

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

function isAllowedAssetPath(relativePath: string): boolean {
  if (!relativePath || relativePath.includes("..")) return false;
  return ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

function contentTypeForPath(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

async function readLocalAsset(relativePath: string): Promise<Buffer | null> {
  const diskPath = path.resolve(PUBLIC_DIR, relativePath);
  if (!diskPath.startsWith(PUBLIC_DIR)) return null;

  try {
    return await fs.readFile(diskPath);
  } catch {
    return null;
  }
}

async function readGitHubAsset(relativePath: string): Promise<Buffer | null> {
  const cfg = githubConfig();
  if (!cfg) return null;

  const githubPath = `public/${relativePath}`;
  const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${encodeURIComponent(cfg.branch)}/${githubPath}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;

  return Buffer.from(await res.arrayBuffer());
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const relativePath = segments.join("/");

  if (!isAllowedAssetPath(relativePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = (await readLocalAsset(relativePath)) ?? (await readGitHubAsset(relativePath));

  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentTypeForPath(relativePath),
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
