import { NextResponse } from "next/server";
import { z } from "zod";

import { appendContactSubmission, readContactSubmissions, writeContactSubmissions } from "@/lib/contact-submissions";
import { canPersistJson, readContentFile } from "@/lib/content-store";
import { isMailConfigured, sendContactEmail } from "@/lib/send-contact-email";
import type { SiteInfo } from "@/lib/data";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(1000),
  website: z.string().optional().default(""),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
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

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid form data" },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true, saved: true, email_sent: false });
  }

  const { name, email, message } = parsed.data;
  let saved = false;
  let submissionId: string | undefined;
  let emailSent = false;
  let emailError: string | undefined;

  if (canPersistJson()) {
    try {
      const submission = await appendContactSubmission({ name, email, message, email_sent: false });
      saved = true;
      submissionId = submission.id;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not save message. Check GitHub storage env on Vercel.",
        },
        { status: 503 },
      );
    }
  }

  if (isMailConfigured()) {
    try {
      const site = (await readContentFile("site")) as SiteInfo;
      const toEmail = process.env.CONTACT_TO_EMAIL || site.email;
      await sendContactEmail({ name, email, message, toEmail });
      emailSent = true;

      if (submissionId) {
        const store = await readContactSubmissions();
        const row = store.submissions.find((s) => s.id === submissionId);
        if (row) {
          row.email_sent = true;
          await writeContactSubmissions(store);
        }
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Email delivery failed";
    }
  }

  if (!saved && !emailSent) {
    return NextResponse.json(
      {
        error:
          "Contact is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD for email, and GitHub env vars for JSON records on free hosting.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    saved,
    email_sent: emailSent,
    email_configured: isMailConfigured(),
    ...(emailError ? { email_warning: emailError } : {}),
  });
}
