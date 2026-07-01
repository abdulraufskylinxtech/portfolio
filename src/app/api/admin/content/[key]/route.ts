import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  canPersistJson,
  getStorageMode,
  isContentKey,
  isReadOnlyHosting,
  readContentFile,
  validateContent,
  writeContentFile,
} from "@/lib/content-store";

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await context.params;
  if (!isContentKey(key)) {
    return NextResponse.json({ error: "Unknown content file" }, { status: 400 });
  }

  try {
    const data = await readContentFile(key);
    return NextResponse.json({
      key,
      data,
      readOnlyHosting: isReadOnlyHosting(),
      storageMode: getStorageMode(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to read content file" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canPersistJson()) {
    return NextResponse.json(
      {
        error:
          "Saving is disabled on this host. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in env to persist JSON on free Vercel hosting.",
      },
      { status: 503 },
    );
  }

  const { key } = await context.params;
  if (!isContentKey(key)) {
    return NextResponse.json({ error: "Unknown content file" }, { status: 400 });
  }

  let body: { data?: unknown };
  try {
    body = (await request.json()) as { data?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.data === undefined) {
    return NextResponse.json({ error: "Missing data field" }, { status: 400 });
  }

  const validationError = validateContent(key, body.data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await writeContentFile(key, body.data);
    return NextResponse.json({ ok: true, key });
  } catch {
    return NextResponse.json({ error: "Failed to write content file" }, { status: 500 });
  }
}
