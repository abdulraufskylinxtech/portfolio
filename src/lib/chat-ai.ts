import type { Project, SiteInfo } from "@/lib/data";
import type { ChatMessage } from "@/lib/chat-sessions";
import {
  buildPortfolioKnowledge,
  composeFriendlyReply,
  detectIntent,
  findBestKnowledgeMatch,
} from "@/lib/portfolio-knowledge";

export type ChatAiProvider = "groq" | "openai" | "knowledge";

export type ChatAiResult = {
  response: string;
  provider: ChatAiProvider;
};

type LlmConfig = {
  url: string;
  apiKey: string;
  model: string;
  provider: "groq" | "openai";
};

function developerName(site: SiteInfo): string {
  const fromName = site.name?.trim();
  if (fromName) return fromName;

  const fromGithub = site.github.match(/github\.com\/([^/?#]+)/i)?.[1];
  if (fromGithub) {
    return fromGithub
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "the developer";
}

function buildKnowledgeContext(site: SiteInfo, projects: Project[]): string {
  const chunks = buildPortfolioKnowledge(site, projects);
  return chunks.map((chunk) => `## ${chunk.title}\n${chunk.content}`).join("\n\n");
}

function buildSystemPrompt(site: SiteInfo, projects: Project[]): string {
  const name = developerName(site);
  const knowledge = buildKnowledgeContext(site, projects);

  return [
    `You are a warm, friendly portfolio assistant helping visitors learn about ${name}, a ${site.role}.`,
    "Speak naturally — like a helpful colleague in a chat, not a resume dump or bullet list.",
    "Answer ONLY using the portfolio knowledge below. Never invent facts.",
    "Allowed topics: skills, tech stack, work experience, projects, education, hobbies, contact, CV download, availability.",
    "If asked something off-topic (weather, politics, homework, unrelated coding), politely decline and suggest a portfolio question.",
    "Answer the specific question first. If they ask about React, focus on React — not generic stats.",
    "Keep replies concise (2–4 short paragraphs max). Use plain text, no markdown.",
    "If data is missing, say so honestly.",
    "",
    "--- PORTFOLIO KNOWLEDGE ---",
    knowledge,
  ].join("\n");
}

const SCOPE_SUGGESTIONS = [
  "What are your skills?",
  "Tell me about your work experience",
  "Which projects have you built?",
  "How can I contact you?",
];

function fallbackResponse(
  userMessage: string,
  site: SiteInfo,
  projects: Project[],
): string {
  const knowledge = buildPortfolioKnowledge(site, projects);
  const intent = detectIntent(userMessage, knowledge);
  const name = developerName(site);

  if (intent === "greeting") {
    return `Hi! I'm the portfolio assistant for ${name}. I can answer questions about skills, experience, projects, education, and contact details based on the CV and portfolio. What would you like to know?`;
  }

  if (intent === "thanks") {
    return "You're welcome! Ask me anything else about skills, experience, projects, or how to get in touch.";
  }

  if (intent === "bye") {
    return "Goodbye! Come back anytime if you want to learn more about this developer's background.";
  }

  if (intent === "smalltalk") {
    return "I'm doing well, thanks! I'm here to help with portfolio and CV questions — skills, projects, experience, or contact info.";
  }

  if (intent === "off-topic") {
    return `I can only discuss ${name}'s professional background — skills, work experience, projects, education, CV, and contact details.\n\nTry asking:\n${SCOPE_SUGGESTIONS.map((s) => `- ${s}`).join("\n")}`;
  }

  const friendly = composeFriendlyReply(userMessage, site, projects);
  if (friendly) {
    return friendly;
  }

  const match = findBestKnowledgeMatch(userMessage, knowledge);
  if (match && !["stats", "skills-all", "experience-all", "projects-all"].includes(match.id)) {
    return match.content.replace(/\*\*/g, "");
  }

  return `I don't have information about that in the portfolio knowledge base.\n\nI can help with:\n- Skills and tech stack\n- Work experience\n- Projects\n- Education\n- Contact details${site.cv?.url ? "\n- Resume / CV download" : ""}\n\nTry one of these:\n${SCOPE_SUGGESTIONS.map((s) => `- ${s}`).join("\n")}`;
}

function historyForModel(messages: ChatMessage[], limit = 12): { role: "user" | "assistant"; content: string }[] {
  return messages.slice(-limit).map((m) => ({ role: m.role, content: m.content }));
}

function getLlmConfig(): LlmConfig | null {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    };
  }

  return null;
}

export function isLlmConfigured(): boolean {
  return getLlmConfig() !== null;
}

/** @deprecated Use isLlmConfigured */
export function isOpenAiConfigured(): boolean {
  return isLlmConfigured();
}

async function callLlm(
  config: LlmConfig,
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
): Promise<string> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.6,
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${config.provider} error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${config.provider} returned an empty response`);
  return text;
}

export async function generateChatResponse(
  userMessage: string,
  history: ChatMessage[],
  site: SiteInfo,
  projects: Project[],
): Promise<ChatAiResult> {
  const llm = getLlmConfig();

  if (llm) {
    try {
      const response = await callLlm(
        llm,
        buildSystemPrompt(site, projects),
        historyForModel(history),
        userMessage,
      );
      return { response, provider: llm.provider };
    } catch (err) {
      console.error(`${llm.provider} chat failed, using knowledge fallback:`, err);
    }
  }

  return {
    response: fallbackResponse(userMessage, site, projects),
    provider: "knowledge",
  };
}
