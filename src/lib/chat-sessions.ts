import { randomUUID } from "crypto";

import { readDataJson, writeDataJson } from "@/lib/json-store";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ChatSession = {
  id: string;
  started_at: string;
  updated_at: string;
  locale?: string;
  user_agent?: string;
  page_url?: string;
  referrer?: string;
  message_count: number;
  preview: string;
  messages: ChatMessage[];
  read: boolean;
};

export type ChatSessionsFile = {
  sessions: ChatSession[];
};

const FILE = "chat-sessions.json";
const MAX_SESSIONS = 500;

export async function readChatSessions(): Promise<ChatSessionsFile> {
  try {
    const parsed = (await readDataJson(FILE)) as ChatSessionsFile;
    return { sessions: parsed.sessions ?? [] };
  } catch {
    return { sessions: [] };
  }
}

export async function writeChatSessions(data: ChatSessionsFile): Promise<void> {
  await writeDataJson(FILE, data);
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const data = await readChatSessions();
  return data.sessions.find((s) => s.id === sessionId) ?? null;
}

export async function appendChatMessages(
  sessionId: string,
  messages: Pick<ChatMessage, "role" | "content">[],
  meta?: {
    locale?: string;
    user_agent?: string;
    page_url?: string;
    referrer?: string;
  },
): Promise<ChatSession> {
  const data = await readChatSessions();
  const now = new Date().toISOString();
  const stamped: ChatMessage[] = messages.map((m) => ({
    ...m,
    created_at: now,
  }));

  let session = data.sessions.find((s) => s.id === sessionId);

  if (!session) {
    const firstUser = messages.find((m) => m.role === "user");
    session = {
      id: sessionId,
      started_at: now,
      updated_at: now,
      locale: meta?.locale,
      user_agent: meta?.user_agent,
      page_url: meta?.page_url,
      referrer: meta?.referrer,
      message_count: 0,
      preview: firstUser?.content.slice(0, 120) ?? "",
      messages: [],
      read: false,
    };
    data.sessions.unshift(session);
  }

  session.messages.push(...stamped);
  session.updated_at = now;
  session.message_count = session.messages.filter((m) => m.role === "user").length;
  if (!session.preview && messages.some((m) => m.role === "user")) {
    const firstUser = messages.find((m) => m.role === "user");
    session.preview = firstUser?.content.slice(0, 120) ?? "";
  }
  if (meta?.locale) session.locale = meta.locale;
  if (meta?.user_agent) session.user_agent = meta.user_agent;
  if (meta?.page_url) session.page_url = meta.page_url;
  if (meta?.referrer) session.referrer = meta.referrer;

  if (data.sessions.length > MAX_SESSIONS) {
    data.sessions = data.sessions.slice(0, MAX_SESSIONS);
  }

  await writeChatSessions(data);
  return session;
}

export function createChatSessionId(): string {
  return randomUUID();
}

export function validateChatSessionsFile(data: unknown): string | null {
  if (!data || typeof data !== "object") return "Must be a JSON object";
  const wrapper = data as { sessions?: unknown };
  if (!Array.isArray(wrapper.sessions)) return "Must have a sessions array";
  return null;
}
