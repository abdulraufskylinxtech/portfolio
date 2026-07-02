export type LlmProvider = "groq" | "openai";

export type LlmConfig = {
  url: string;
  apiKey: string;
  model: string;
  provider: LlmProvider;
};

export function getLlmConfig(): LlmConfig | null {
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

export async function callLlmCompletion(
  config: LlmConfig,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${config.provider} error ${res.status}: ${errBody.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${config.provider} returned an empty response`);
  return text;
}

export function parseJsonFromLlm<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || text.trim();
  return JSON.parse(candidate) as T;
}
