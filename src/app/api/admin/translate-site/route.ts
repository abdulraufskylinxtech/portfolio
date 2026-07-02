import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { translateAndSaveSite } from "@/lib/site-translations";
import { isLlmConfigured } from "@/lib/llm-client";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      { error: "AI translation requires GROQ_API_KEY or OPENAI_API_KEY in .env" },
      { status: 503 },
    );
  }

  try {
    const site = await translateAndSaveSite();
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
