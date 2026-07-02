import type { Project, SiteInfo } from "@/lib/data";
import { isExperiencePublished } from "@/lib/data";

export type KnowledgeChunk = {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  content: string;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s+#.]/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueWords(...parts: string[]): string[] {
  const set = new Set<string>();
  for (const part of parts) {
    for (const word of normalize(part).split(" ")) {
      if (word.length > 2) set.add(word);
    }
  }
  return [...set];
}

export function buildPortfolioKnowledge(site: SiteInfo, projects: Project[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  chunks.push({
    id: "profile",
    category: "about",
    title: "Profile",
    keywords: uniqueWords(
      "about bio profile developer shakeel latif introduction who",
      site.role,
      site.bio,
      site.location,
      site.availability,
    ),
    content: `**${site.role}**\n\n${site.bio}\n\n**Location:** ${site.location}\n**Availability:** ${site.availability}`,
  });

  if (site.stats.length) {
    chunks.push({
      id: "stats",
      category: "about",
      title: "Career stats",
      keywords: uniqueWords("stats summary numbers career overview", ...site.stats.map((s) => `${s.value} ${s.label}`)),
      content: site.stats.map((s) => `- **${s.value}** ${s.label}`).join("\n"),
    });
  }

  const skillGroups = Object.entries(site.skills) as [string, string[]][];
  for (const [group, items] of skillGroups) {
    if (!items.length) continue;
    chunks.push({
      id: `skills-${group}`,
      category: "skills",
      title: `${group} skills`,
      keywords: uniqueWords("skill skills stack technology technologies tech", group, ...items),
      content: `**${group.charAt(0).toUpperCase() + group.slice(1)}:** ${items.join(", ")}`,
    });
  }

  chunks.push({
    id: "skills-all",
    category: "skills",
    title: "Full skill stack",
    keywords: uniqueWords("skill skills stack technology technologies tech expertise"),
    content: skillGroups
      .map(([group, items]) => `**${group.charAt(0).toUpperCase() + group.slice(1)}:** ${items.join(", ")}`)
      .join("\n"),
  });

  for (const entry of site.experience.filter(isExperiencePublished)) {
    const bullets = entry.bullets.filter(Boolean);
    chunks.push({
      id: `exp-${normalize(entry.company).replace(/\s+/g, "-")}`,
      category: "experience",
      title: `${entry.role} at ${entry.company}`,
      keywords: uniqueWords(
        "experience work job career role company employment",
        entry.role,
        entry.company,
        entry.period,
        entry.location,
        ...entry.tech,
        ...bullets,
      ),
      content: [
        `**${entry.role}** — ${entry.company}`,
        `**Period:** ${entry.period}`,
        `**Location:** ${entry.location}`,
        entry.tech.length ? `**Tech:** ${entry.tech.join(", ")}` : "",
        bullets.length ? `**Highlights:**\n${bullets.map((b) => `- ${b}`).join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  chunks.push({
    id: "experience-all",
    category: "experience",
    title: "Work experience",
    keywords: uniqueWords("experience work history career jobs employment background cv resume"),
    content: site.experience
      .filter(isExperiencePublished)
      .map((e) => `**${e.role}** at ${e.company} (${e.period})`)
      .join("\n"),
  });

  for (const edu of site.education) {
    chunks.push({
      id: `edu-${normalize(edu.degree).slice(0, 40).replace(/\s+/g, "-")}`,
      category: "education",
      title: edu.degree,
      keywords: uniqueWords("education degree study university college qualification course training", edu.degree, edu.institution, edu.year, edu.type),
      content: `**${edu.degree}**\n**Institution:** ${edu.institution}\n**Year:** ${edu.year}`,
    });
  }

  if (site.hobbies.length) {
    chunks.push({
      id: "hobbies",
      category: "about",
      title: "Hobbies",
      keywords: uniqueWords("hobby hobbies interest interests personal", ...site.hobbies),
      content: site.hobbies.map((h) => `- ${h}`).join("\n"),
    });
  }

  for (const project of projects) {
    const apis = project.apis?.length ? `\n**APIs:** ${project.apis.join(", ")}` : "";
    const highlights = project.highlights?.length
      ? `\n**Highlights:**\n${project.highlights.map((h) => `- ${h}`).join("\n")}`
      : "";
    chunks.push({
      id: `project-${project.slug}`,
      category: "projects",
      title: project.title,
      keywords: uniqueWords(
        "project portfolio work built product app platform",
        project.title,
        project.slug,
        project.description,
        ...project.tags,
        ...(project.apis ?? []),
      ),
      content: `**${project.title}**\n\n${project.description}\n\n**Tech:** ${project.tags.join(", ")}${apis}${highlights}`,
    });
  }

  if (projects.length) {
    chunks.push({
      id: "projects-all",
      category: "projects",
      title: "Projects overview",
      keywords: uniqueWords("project projects portfolio work built products"),
      content: projects
        .map((p) => `**${p.title}** — ${p.description.slice(0, 120)}${p.description.length > 120 ? "…" : ""}`)
        .join("\n\n"),
    });
  }

  chunks.push({
    id: "contact",
    category: "contact",
    title: "Contact",
    keywords: uniqueWords("contact email hire reach linkedin github whatsapp instagram message", site.email),
    content: [
      `**Email:** ${site.email}`,
      site.whatsapp ? `**WhatsApp:** ${site.whatsapp}` : "",
      `**LinkedIn:** ${site.linkedin}`,
      `**GitHub:** ${site.github}`,
      site.instagram ? `**Instagram:** ${site.instagram}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (site.cv?.url) {
    chunks.push({
      id: "cv",
      category: "cv",
      title: "Resume / CV",
      keywords: uniqueWords("cv resume curriculum vitae download pdf document"),
      content: `A resume/CV is available on this portfolio${site.cv.filename ? ` (${site.cv.filename})` : ""}. You can download it from the **Resume** link in the navigation bar.`,
    });
  }

  return chunks;
}

const GREETING_WORDS = ["hello", "hi", "hey", "salam", "assalam", "good morning", "good afternoon", "good evening"];
const THANKS_WORDS = ["thank", "thanks", "thx", "appreciate"];
const BYE_WORDS = ["bye", "goodbye", "see you", "later", "take care"];
const SMALLTALK_WORDS = ["how are you", "how are u", "how's it going", "how is it going"];

const OFF_TOPIC_PATTERNS = [
  /\bweather\b/,
  /\bforecast\b/,
  /\btemperature\b/,
  /\bpolitic/,
  /\belection\b/,
  /\bpresident\b/,
  /\brecipe\b/,
  /\bcook(ing)?\b/,
  /\bhomework\b/,
  /\bwrite (me )?(a )?code\b/,
  /\bbitcoin\b/,
  /\bcrypto(currency)?\b/,
  /\bstock price\b/,
  /\bmovie\b/,
  /\bfootball score\b/,
  /\bwho won the match\b/,
  /\btell me a joke\b/,
  /\bgeneral knowledge\b/,
];

export type PortfolioIntent =
  | "greeting"
  | "thanks"
  | "bye"
  | "smalltalk"
  | "off-topic"
  | "portfolio";

export function detectIntent(message: string, chunks: KnowledgeChunk[]): PortfolioIntent {
  const msg = normalize(message);
  if (!msg) return "portfolio";

  const has = (words: string[]) => words.some((w) => msg.includes(w));

  if (has(GREETING_WORDS)) return "greeting";
  if (has(THANKS_WORDS)) return "thanks";
  if (BYE_WORDS.some((w) => msg.includes(w))) return "bye";
  if (has(SMALLTALK_WORDS)) return "smalltalk";
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(msg))) return "off-topic";

  const portfolioTerms = new Set<string>([
    "skill",
    "skills",
    "stack",
    "technology",
    "technologies",
    "tech",
    "project",
    "projects",
    "portfolio",
    "experience",
    "work",
    "job",
    "career",
    "role",
    "company",
    "education",
    "degree",
    "university",
    "college",
    "contact",
    "email",
    "hire",
    "linkedin",
    "github",
    "resume",
    "cv",
    "bio",
    "about",
    "developer",
    "shakeel",
    "latif",
    "availability",
    "hobby",
    "hobbies",
    "api",
    "apis",
    "built",
    "background",
  ]);

  for (const chunk of chunks) {
    for (const keyword of chunk.keywords) {
      if (keyword.length > 2) portfolioTerms.add(keyword);
    }
  }

  const inScope = [...portfolioTerms].some((term) => msg.includes(term));
  return inScope ? "portfolio" : "off-topic";
}

const GENERIC_QUERY_WORDS = new Set([
  "what",
  "your",
  "you",
  "have",
  "tell",
  "about",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "are",
  "how",
  "can",
  "does",
  "did",
  "was",
  "were",
  "any",
  "all",
  "his",
  "her",
  "who",
  "when",
  "where",
  "why",
  "which",
  "much",
  "many",
  "some",
  "experience",
  "experiences",
  "skill",
  "skills",
  "project",
  "projects",
  "work",
  "working",
  "worked",
  "job",
  "jobs",
  "career",
  "background",
  "know",
  "use",
  "using",
  "used",
  "build",
  "built",
  "developer",
  "development",
  "years",
  "year",
]);

function techToken(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

function techMatches(queryTerm: string, candidate: string): boolean {
  const q = techToken(queryTerm);
  const c = techToken(candidate);
  if (!q || !c) return false;
  if (q === c) return true;

  const aliases: Record<string, string[]> = {
    react: ["reactjs", "react.js"],
    angular: ["angularjs", "angular4", "angular4+"],
    node: ["nodejs", "node.js"],
    vue: ["vuejs", "vue.js"],
    next: ["nextjs", "next.js"],
    typescript: ["ts"],
    javascript: ["js"],
    postgres: ["postgresql", "postgressql"],
    mysql: ["my sql"],
  };

  for (const [base, list] of Object.entries(aliases)) {
    const group = [base, ...list].map(techToken);
    const qHit = group.some((g) => q === g || (g.startsWith(q) && q.length >= 3) || (q.startsWith(g) && g.length >= 3));
    const cHit = group.some((g) => c === g || (g.startsWith(c) && c.length >= 3) || (c.startsWith(g) && g.length >= 3));
    if (qHit && cHit) return true;
  }

  if (c.startsWith(q) && q.length >= 3) return true;
  if (q.startsWith(c) && c.length >= 3) return true;

  return false;
}

function extractTechTerms(message: string, site: SiteInfo, projects: Project[]): string[] {
  const msg = normalize(message);
  const terms = new Set<string>();

  const allTech: string[] = [
    ...Object.values(site.skills).flat(),
    ...site.experience.flatMap((e) => e.tech),
    ...projects.flatMap((p) => p.tags),
    ...site.bio.split(/[\s,]+/),
  ];

  for (const tech of allTech) {
    const token = techToken(tech);
    if (token.length < 2) continue;
    if (msg.includes(token) || msg.includes(normalize(tech))) {
      terms.add(tech);
    }
  }

  for (const word of msg.split(" ")) {
    if (word.length < 3 || GENERIC_QUERY_WORDS.has(word)) continue;
    for (const tech of allTech) {
      if (techMatches(word, tech)) terms.add(tech);
    }
  }

  return [...terms];
}

function developerNameFromSite(site: SiteInfo): string {
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

export function composeFriendlyReply(
  message: string,
  site: SiteInfo,
  projects: Project[],
): string | null {
  const msg = normalize(message);
  const name = developerNameFromSite(site);
  const publishedExperience = site.experience.filter(isExperiencePublished);
  const techTerms = extractTechTerms(message, site, projects);

  if (techTerms.length > 0) {
    const primary = techTerms[0];
    const skillGroups = Object.entries(site.skills) as [string, string[]][];
    const skillHits = skillGroups
      .filter(([, items]) => items.some((item) => techTerms.some((t) => techMatches(t, item))))
      .map(([group, items]) => {
        const matched = items.filter((item) => techTerms.some((t) => techMatches(t, item)));
        return `${group}: ${matched.join(", ")}`;
      });

    const workHits = publishedExperience.filter((entry) =>
      entry.tech.some((t) => techTerms.some((term) => techMatches(term, t))),
    );

    const projectHits = projects.filter((p) =>
      p.tags.some((tag) => techTerms.some((term) => techMatches(term, tag))),
    );

    const lines: string[] = [];
    lines.push(`Great question! ${name} has hands-on experience with ${primary}.`);

    if (skillHits.length) {
      const matchedSkills = [
        ...new Set(
          skillHits.flatMap((hit) => {
            const items = hit.split(": ")[1] ?? "";
            return items.split(", ").filter((item) => techTerms.some((t) => techMatches(t, item)));
          }),
        ),
      ];
      const group = skillHits[0].split(":")[0];
      lines.push(`It's listed in his ${group} skills (${matchedSkills.join(", ")}).`);
    }

    if (workHits.length) {
      const jobs = workHits
        .slice(0, 3)
        .map((e) => `${e.role} at ${e.company} (${e.period.split("—")[0]?.trim()})`)
        .join("; ");
      lines.push(`He's used it professionally in roles such as ${jobs}.`);

      const relevantBullet = workHits
        .flatMap((e) => e.bullets)
        .find(
          (b) =>
            b.trim() &&
            (techTerms.some((t) => techMatches(t, b)) ||
              projectHits.some((p) => normalize(b).includes(normalize(p.slug).replace(/-/g, " ")))),
        );
      if (relevantBullet) {
        lines.push(`For example: ${relevantBullet}`);
      }
    }

    if (projectHits.length) {
      const names = projectHits.slice(0, 2).map((p) => p.title).join(" and ");
      lines.push(`You can also see it in projects like ${names}.`);
    }

    if (!skillHits.length && !workHits.length && !projectHits.length) {
      if (techMatches(primary, site.bio) || techTerms.some((t) => normalize(site.bio).includes(techToken(t)))) {
        lines.push(site.bio);
      } else {
        return null;
      }
    }

    lines.push("Happy to share more — ask about a specific project or role if you'd like!");
    return lines.join("\n\n");
  }

  if (/\b(skill|skills|stack|technologies|tech)\b/.test(msg)) {
    const groups = Object.entries(site.skills) as [string, string[]][];
    const parts = groups
      .filter(([, items]) => items.length)
      .map(([group, items]) => `${group.charAt(0).toUpperCase() + group.slice(1)}: ${items.join(", ")}`);
    return `Sure! Here's ${name}'s tech stack:\n\n${parts.join("\n")}\n\nAsk about any technology and I'll go deeper — for example React, Node.js, or AWS.`;
  }

  if (/\b(experience|work history|career|jobs|employment|worked at|company)\b/.test(msg)) {
    if (publishedExperience.length === 0) {
      return null;
    }
    const summary = publishedExperience
      .slice(0, 4)
      .map((e) => `• ${e.role} at ${e.company} (${e.period})`)
      .join("\n");
    return `Here's a quick overview of ${name}'s work experience:\n\n${summary}\n\nWant details on a specific company or role? Just ask!`;
  }

  if (/\b(project|projects|portfolio|built|app)\b/.test(msg)) {
    if (projects.length === 0) return null;
    const summary = projects
      .slice(0, 4)
      .map((p) => `• ${p.title} — ${p.description.slice(0, 100)}${p.description.length > 100 ? "…" : ""}`)
      .join("\n");
    return `${name} has worked on projects including:\n\n${summary}\n\nAsk about any project by name for more detail!`;
  }

  if (/\b(education|degree|university|college|study|studied)\b/.test(msg)) {
    if (!site.education.length) return null;
    const summary = site.education.map((e) => `• ${e.degree} — ${e.institution} (${e.year})`).join("\n");
    return `${name}'s education:\n\n${summary}`;
  }

  if (/\b(contact|email|hire|reach|linkedin|github|whatsapp|get in touch)\b/.test(msg)) {
    const parts = [
      `Email: ${site.email}`,
      site.whatsapp ? `WhatsApp: ${site.whatsapp}` : "",
      `LinkedIn: ${site.linkedin}`,
      `GitHub: ${site.github}`,
    ].filter(Boolean);
    return `You can reach ${name} here:\n\n${parts.join("\n")}\n\nFeel free to get in touch for opportunities!`;
  }

  if (/\b(cv|resume|download)\b/.test(msg) && site.cv?.url) {
    return `Yes! ${name}'s resume is available on this site — use the Resume link in the navigation bar to download it.`;
  }

  if (/\b(about|who are you|bio|introduction|background)\b/.test(msg)) {
    return `About ${name}: ${site.bio}\n\nHe's a ${site.role}, based in ${site.location}. ${site.availability}`;
  }

  for (const entry of publishedExperience) {
    if (msg.includes(normalize(entry.company)) || msg.includes(normalize(entry.company).split(" ")[0])) {
      const bullets = entry.bullets.filter(Boolean).map((b) => `• ${b}`).join("\n");
      return `At ${entry.company}, ${name} worked as ${entry.role} (${entry.period}).\n\nTech: ${entry.tech.join(", ")}${bullets ? `\n\nHighlights:\n${bullets}` : ""}`;
    }
  }

  for (const project of projects) {
    if (msg.includes(normalize(project.title)) || msg.includes(normalize(project.slug))) {
      return `${project.title}\n\n${project.description}\n\nTech: ${project.tags.join(", ")}`;
    }
  }

  return null;
}

const OVERVIEW_CHUNK_IDS = new Set(["stats", "skills-all", "experience-all", "projects-all"]);

export function scoreKnowledgeMatch(message: string, chunk: KnowledgeChunk): number {
  const msg = normalize(message);
  let score = 0;
  const techTerms = msg.split(" ").filter((w) => w.length > 2 && !GENERIC_QUERY_WORDS.has(w));

  for (const keyword of chunk.keywords) {
    if (keyword.length < 3) continue;
    if (GENERIC_QUERY_WORDS.has(keyword) && techTerms.length > 0) continue;
    if (msg.includes(keyword)) {
      score += keyword.length > 6 && !GENERIC_QUERY_WORDS.has(keyword) ? 4 : 1;
    }
  }

  if (msg.includes(normalize(chunk.title))) score += 5;

  if (OVERVIEW_CHUNK_IDS.has(chunk.id) && techTerms.length > 0) {
    score -= 3;
  }

  if (chunk.category === "skills" && /\b(skill|skills|stack|tech)\b/.test(msg)) {
    score += 3;
  }

  return score;
}

export function findBestKnowledgeMatch(
  message: string,
  chunks: KnowledgeChunk[],
): KnowledgeChunk | null {
  let best: KnowledgeChunk | null = null;
  let bestScore = 0;

  for (const chunk of chunks) {
    const score = scoreKnowledgeMatch(message, chunk);
    if (score > bestScore) {
      bestScore = score;
      best = chunk;
    }
  }

  return bestScore >= 2 ? best : null;
}
