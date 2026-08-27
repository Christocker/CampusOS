import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
  return sendEmail({
    to,
    subject: `CampusOS: You ${verb} ${subjectName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1C1C1E;">CampusOS Notification</h2>
        <p style="color: #8E8E93; font-size: 15px;">
          Hi ${userName}, you have been <strong>${verb}</strong> <strong>${subjectName}</strong>.
        </p>
        <p style="color: #8E8E93; font-size: 13px; margin-top: 24px;">
          This is an automated message from CampusOS.
        </p>
      </div>
    `,
  });
}
