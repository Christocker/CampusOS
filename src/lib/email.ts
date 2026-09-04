import nodemailer from "nodemailer";

/** Escapes a value for safe interpolation into HTML email templates. */
export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Keeps user text from breaking email headers (line breaks / length). */
function safeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 200);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s/g, ""),
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!process.env.SMTP_USER) {
    console.log("[Email] SMTP not configured. Skipping email to:", to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log("[Email] Sent to:", to);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

export async function sendEnrollmentEmail({
  to,
  userName,
  subjectName,
  action,
}: {
  to: string;
  userName: string;
  subjectName: string;
  action: "enrolled" | "unenrolled";
}): Promise<boolean> {
  const verb = action === "enrolled" ? "enrolled in" : "unenrolled from";
  const safeName = escapeHtml(userName);
  const safeSubject = escapeHtml(subjectName);
  return sendEmail({
    to,
    subject: safeHeader(`CampusOS: You ${verb} ${subjectName}`),
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1C1C1E;">CampusOS Notification</h2>
        <p style="color: #8E8E93; font-size: 15px;">
          Hi ${safeName}, you have been <strong>${verb}</strong> <strong>${safeSubject}</strong>.
        </p>
        <p style="color: #8E8E93; font-size: 13px; margin-top: 24px;">
          This is an automated message from CampusOS.
        </p>
      </div>
    `,
  });
}
