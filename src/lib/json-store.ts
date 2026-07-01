import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

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

/** True on Vercel/serverless where local disk writes do not persist. */
export function isEphemeralHosting(): boolean {
  return Boolean(process.env.VERCEL);
}

export function isGitHubStorageEnabled(): boolean {
  return githubConfig() !== null;
}

/** JSON files can be saved locally or via GitHub API on free serverless hosts. */
export function canPersistJson(): boolean {
  return !isEphemeralHosting() || isGitHubStorageEnabled();
}

function resolveDataPath(relativePath: string): string {
  const resolved = path.resolve(DATA_DIR, relativePath);
  if (!resolved.startsWith(DATA_DIR)) {
    throw new Error("Invalid data path");
  }
  return resolved;
}

async function readFromDisk(relativePath: string): Promise<string> {
  return fs.readFile(resolveDataPath(relativePath), "utf8");
}

async function writeToDisk(relativePath: string, json: string): Promise<void> {
  await fs.writeFile(resolveDataPath(relativePath), json, "utf8");
}

async function readFromGitHub(relativePath: string): Promise<{ raw: string; sha?: string }> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GitHub storage is not configured");

  const filePath = `data/${relativePath}`;
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${encodeURIComponent(cfg.branch)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return { raw: "{}" };
  }

  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status})`);
  }

  const body = (await res.json()) as GitHubFileResponse;
  const raw = body.content
    ? Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8")
    : "{}";

  return { raw, sha: body.sha };
}

async function writeToGitHub(
  relativePath: string,
  json: string,
  sha?: string,
): Promise<void> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GitHub storage is not configured");

  const filePath = `data/${relativePath}`;
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
      message: `chore: update data/${relativePath}`,
      content: Buffer.from(json, "utf8").toString("base64"),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as GitHubFileResponse;
    throw new Error(body.message || `GitHub write failed (${res.status})`);
  }
}

/** Read JSON from GitHub on serverless (when configured), otherwise from disk. */
export async function readDataJson(relativePath: string): Promise<unknown> {
  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    const { raw } = await readFromGitHub(relativePath);
    return JSON.parse(raw) as unknown;
  }

  const raw = await readFromDisk(relativePath);
  return JSON.parse(raw) as unknown;
}

/** Write JSON to GitHub or local disk. */
export async function writeDataJson(relativePath: string, data: unknown): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;

  if (!canPersistJson()) {
    throw new Error(
      "JSON storage unavailable. On Vercel, set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in env.",
    );
  }

  if (isEphemeralHosting() && isGitHubStorageEnabled()) {
    const existing = await readFromGitHub(relativePath).catch(() => ({ raw: "{}", sha: undefined }));
    await writeToGitHub(relativePath, json, existing.sha);
    return;
  }

  await writeToDisk(relativePath, json);
}

export function getStorageMode(): "local" | "github" | "readonly" {
  if (!isEphemeralHosting()) return "local";
  if (isGitHubStorageEnabled()) return "github";
  return "readonly";
}
