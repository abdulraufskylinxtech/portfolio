import type { Project, SiteInfo } from "@/lib/data";
import {
  buildPortfolioKnowledge,
  detectIntent,
  findBestKnowledgeMatch,
} from "@/lib/portfolio-knowledge";

interface AIResponse {
  response: string;
  confidence: number;
}

const SCOPE_SUGGESTIONS = [
  '"What are your skills?"',
  '"Tell me about your work experience"',
  '"Which projects have you built?"',
  '"How can I contact you?"',
];

export const mimicAI = async (
  userMessage: string,
  site: SiteInfo,
  projects: Project[],
): Promise<AIResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 250));

  const knowledge = buildPortfolioKnowledge(site, projects);
  const intent = detectIntent(userMessage, knowledge);

  if (intent === "greeting") {
    const name = site.name?.trim() || "the developer";
    return {
      response:
        `Hi! I'm the portfolio assistant for **${name}**. I can answer questions about their **skills, experience, projects, education, and contact details** based on their CV and portfolio.\n\nWhat would you like to know?`,
      confidence: 0.95,
    };
  }

  if (intent === "thanks") {
    return {
      response:
        "You're welcome! Ask me anything else about skills, experience, projects, or how to get in touch.",
      confidence: 0.9,
    };
  }

  if (intent === "bye") {
    return {
      response: "Goodbye! Come back anytime if you want to learn more about this developer's background.",
      confidence: 0.9,
    };
  }

  if (intent === "smalltalk") {
    return {
      response:
        "I'm doing well, thanks! I'm here to help with portfolio and CV questions — skills, projects, experience, or contact info.",
      confidence: 0.88,
    };
  }

  if (intent === "off-topic") {
    const name = site.name?.trim() || "this developer";
    return {
      response:
        `I can only discuss **${name}'s professional background** — skills, work experience, projects, education, CV, and contact details.\n\nTry asking:\n${SCOPE_SUGGESTIONS.map((s) => `- ${s}`).join("\n")}`,
      confidence: 0.98,
    };
  }

  const match = findBestKnowledgeMatch(userMessage, knowledge);
  if (match) {
    return {
      response: match.content,
      confidence: 0.92,
    };
  }

  return {
    response:
      `I don't have information about that in the portfolio/CV knowledge base.\n\nI can help with:\n- Skills & tech stack\n- Work experience\n- Projects\n- Education\n- Contact details${site.cv?.url ? "\n- Resume / CV download" : ""}\n\nTry one of these:\n${SCOPE_SUGGESTIONS.map((s) => `- ${s}`).join("\n")}`,
    confidence: 0.8,
  };
};
