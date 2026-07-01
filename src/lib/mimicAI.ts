import type { Project, SiteInfo } from "@/lib/data";

interface AIResponse {
  response: string;
  confidence: number;
}

const skills = {
  frontend: ["React", "Next.js", "TailwindCSS", "TypeScript", "Framer Motion"],
  backend: ["Node.js", "Python", "PostgreSQL", "Express"],
  aiml: ["TensorFlow", "Hugging Face", "LangChain", "OpenAI API"],
  devops: ["Docker", "Kubernetes", "AWS", "CI/CD", "GitHub Actions"],
};

export const mimicAI = async (
  userMessage: string,
  site: SiteInfo,
  projects: Project[],
): Promise<AIResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 300));

  const msg = userMessage.toLowerCase();
  const hasAny = (words: string[]) => words.some((word) => msg.includes(word));

  for (const project of projects) {
    const nameLower = project.title.toLowerCase();
    const slugLower = project.slug.toLowerCase();
    if (msg.includes(nameLower) || msg.includes(slugLower.replace(/-/g, " "))) {
      const apis = project.apis?.length
        ? `\n\n**APIs:** ${project.apis.join(", ")}`
        : "";
      const highlights = project.highlights?.length
        ? `\n\n**Highlights:**\n${project.highlights.map((h) => `- ${h}`).join("\n")}`
        : "";
      return {
        response: `**${project.title}**\n\n${project.description}\n\n**Tech:** ${project.tags.join(", ")}${apis}${highlights}`,
        confidence: 0.96,
      };
    }
  }

  if (hasAny(["hello", "hi", "hey", "salam", "assalam", "good morning", "good afternoon", "good evening"])) {
    return {
      response: "Hi there! I’m the portfolio chat assistant. Ask me about the developer’s skills, projects, or contact details.",
      confidence: 0.9,
    };
  }

  if (hasAny(["thank", "thanks", "thx", "appreciate"])) {
    return {
      response: "You’re welcome! If you want, I can tell you about projects, skills, or how to contact the developer.",
      confidence: 0.9,
    };
  }

  if (hasAny(["how are you", "how are u", "how’s it going", "how is it going"])) {
    return {
      response: "I’m doing great, thanks for asking! I’m here to help with portfolio questions and project details.",
      confidence: 0.9,
    };
  }

  if (hasAny(["bye", "goodbye", "see you", "later", "take care"])) {
    return {
      response: "Goodbye! Feel free to come back anytime if you want to chat about projects or skills.",
      confidence: 0.85,
    };
  }

  if (hasAny(["skill", "technolog", "stack"])) {
    return {
      response: `My technical skillset:\n- Frontend: ${skills.frontend.join(", ")}\n- Backend: ${skills.backend.join(", ")}\n- AI/ML: ${skills.aiml.join(", ")}\n- DevOps: ${skills.devops.join(", ")}`,
      confidence: 0.9,
    };
  }

  if (hasAny(["project", "work", "built", "portfolio"])) {
    const list = projects
      .map((p) => `**${p.title}** — ${p.description.slice(0, 100)}...`)
      .join("\n\n");
    return {
      response: `Here are some projects I can tell you about:\n\n${list}\n\nAsk me about any specific project for more details!`,
      confidence: 0.94,
    };
  }

  if (hasAny(["about", "who are you", "who", "introduce", "bio"])) {
    return {
      response: `${site.bio} Based in ${site.location}. I can also share details on skills, projects, or how to contact the developer.`,
      confidence: 0.96,
    };
  }

  if (hasAny(["contact", "email", "hire", "linkedin", "github"])) {
    return {
      response: `Reach me at:\n- Email: ${site.email}\n- LinkedIn: ${site.linkedin}\n- GitHub: ${site.github}`,
      confidence: 0.97,
    };
  }

  if (hasAny(["api", "integration", "rest", "graphql"])) {
    const allApis = projects.flatMap((p) => p.apis ?? []);
    const apiList = [...new Set(allApis)];
    return {
      response: apiList.length
        ? `APIs and integrations I’ve worked with:\n${apiList.map((a) => `- ${a}`).join("\n")}`
        : "I don’t have API details for available projects right now, but I can still tell you about skills and work experience.",
      confidence: 0.88,
    };
  }

  return {
    response:
      "I’m here to chat! Ask me about the portfolio, skills, or projects.\n\nNeed a suggestion? Try:\n- \"Tell me about your skills\"\n- \"What projects have you built?\"\n- \"How can I contact you?\"",
    confidence: 0.75,
  };
};
