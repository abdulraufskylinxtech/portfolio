import { NextResponse } from "next/server";
import { z } from "zod";

import { generateChatResponse } from "@/lib/chat-ai";
import {
  appendChatMessages,
  createChatSessionId,
  getChatSession,
} from "@/lib/chat-sessions";
import { canPersistJson, loadContentData } from "@/lib/content-store";

const postSchema = z.object({
  sessionId: z.string().min(8).max(64).optional(),
  message: z.string().min(1).max(2000),
  locale: z.string().max(10).optional(),
  pageUrl: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (!canPersistJson()) {
    return NextResponse.json({ session: null, messages: [] });
  }

  try {
    const session = await getChatSession(sessionId);
    if (!session) {
      return NextResponse.json({ session: null, messages: [] });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        started_at: session.started_at,
        updated_at: session.updated_at,
      },
      messages: session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load chat session" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid chat data" },
      { status: 400 },
    );
  }

  const { message, locale, pageUrl, referrer } = parsed.data;
  const sessionId = parsed.data.sessionId ?? createChatSessionId();

  try {
    const { site, projects } = await loadContentData();
    const publishedProjects = projects.filter((p) => p.published);

    const existing = canPersistJson() ? await getChatSession(sessionId) : null;
    const history = existing?.messages ?? [];

    const ai = await generateChatResponse(message, history, site, publishedProjects);

    if (canPersistJson()) {
      await appendChatMessages(
        sessionId,
        [
          { role: "user", content: message },
          { role: "assistant", content: ai.response },
        ],
        {
          locale,
          user_agent: request.headers.get("user-agent") ?? undefined,
          page_url: pageUrl,
          referrer,
        },
      );
    }

    return NextResponse.json({
      sessionId,
      response: ai.response,
      provider: ai.provider,
      saved: canPersistJson(),
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}
