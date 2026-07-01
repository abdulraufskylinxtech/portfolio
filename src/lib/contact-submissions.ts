import { randomUUID } from "crypto";

import { readDataJson, writeDataJson } from "@/lib/json-store";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  email_sent: boolean;
  read: boolean;
};

export type ContactSubmissionsFile = {
  submissions: ContactSubmission[];
};

const FILE = "contact-submissions.json";

export async function readContactSubmissions(): Promise<ContactSubmissionsFile> {
  try {
    const parsed = (await readDataJson(FILE)) as ContactSubmissionsFile;
    return { submissions: parsed.submissions ?? [] };
  } catch {
    return { submissions: [] };
  }
}

export async function writeContactSubmissions(data: ContactSubmissionsFile): Promise<void> {
  await writeDataJson(FILE, data);
}

export async function appendContactSubmission(
  input: Pick<ContactSubmission, "name" | "email" | "message"> & {
    email_sent?: boolean;
  },
): Promise<ContactSubmission> {
  const data = await readContactSubmissions();
  const submission: ContactSubmission = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    message: input.message,
    created_at: new Date().toISOString(),
    email_sent: input.email_sent ?? false,
    read: false,
  };
  data.submissions.unshift(submission);
  await writeContactSubmissions(data);
  return submission;
}

export function validateContactSubmissionsFile(data: unknown): string | null {
  if (!data || typeof data !== "object") return "Must be a JSON object";
  const wrapper = data as { submissions?: unknown };
  if (!Array.isArray(wrapper.submissions)) return "Must have a submissions array";
  return null;
}
