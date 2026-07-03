import nodemailer from "nodemailer";

type SendContactEmailInput = {
  name: string;
  email: string;
  message: string;
  toEmail: string;
};

function normalizeEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

export function getGmailCredentials(): { user: string; pass: string } | null {
  const user = normalizeEnv(process.env.GMAIL_USER);
  const pass = normalizeEnv(process.env.GMAIL_APP_PASSWORD).replace(/\s/g, "");

  if (!user || !pass) return null;
  return { user, pass };
}

export function isMailConfigured(): boolean {
  return getGmailCredentials() !== null;
}

function buildContactEmailHtml(input: SendContactEmailInput): string {
  const escapedName = escapeHtml(input.name);
  const escapedEmail = escapeHtml(input.email);
  const escapedMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:#0f172a;color:#f8fafc;">
                <h1 style="margin:0;font-size:20px;font-weight:600;">New portfolio contact</h1>
                <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">Someone reached out via your site form.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;color:#334155;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;"><strong>Name:</strong> ${escapedName}</p>
                <p style="margin:0 0 16px;"><strong>Email:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
                <p style="margin:0 0 8px;"><strong>Message:</strong></p>
                <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">${escapedMessage}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                Reply directly to this email to respond to ${escapedName}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toFriendlyMailError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Email delivery failed";
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  if (code === "EAUTH" || /invalid login|authentication failed|username and password/i.test(message)) {
    return "Gmail rejected the login. Use a Google App Password (not your normal Gmail password) in GMAIL_APP_PASSWORD.";
  }

  if (/self-signed|certificate/i.test(message)) {
    return "Gmail TLS connection failed. Check server network/firewall settings.";
  }

  return message;
}

function createGmailTransporter() {
  const credentials = getGmailCredentials();
  if (!credentials) {
    throw new Error("Gmail mailer is not configured");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: credentials,
  });
}

/** Sends contact email via Gmail SMTP — credentials stay server-side only. */
export async function sendContactEmail(input: SendContactEmailInput): Promise<void> {
  const credentials = getGmailCredentials();
  if (!credentials) {
    throw new Error("Gmail mailer is not configured");
  }

  const transporter = createGmailTransporter();
  const subject = `Portfolio contact from ${input.name}`;

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${credentials.user}>`,
      to: input.toEmail,
      replyTo: `"${input.name}" <${input.email}>`,
      subject,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        "",
        "Message:",
        input.message,
      ].join("\n"),
      html: buildContactEmailHtml(input),
    });
  } catch (error) {
    throw new Error(toFriendlyMailError(error));
  }
}
