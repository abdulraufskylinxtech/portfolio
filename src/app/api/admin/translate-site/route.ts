import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { translateAndSaveSite } from "@/lib/site-translations";
import { isLlmConfigured } from "@/lib/llm-client";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      { error: "AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env" },
      { status: 503 },
    );
  }

  let body: { locales?: string[] } = {};
  try {
    body = (await request.json()) as { locales?: string[] };
  } catch {
    body = {};
  }

  try {
    const site = await translateAndSaveSite(body.locales);
    return NextResponse.json({
      ok: true,
      translationsUpdatedAt: site.translationsUpdatedAt,
      translations: site.translations,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 503 },
    );
  }
}
