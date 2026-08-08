export type EmailProvider = "gmail";

export type EmailConfig = {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  gmailClientId: string;
  gmailClientSecret: string;
  gmailRefreshToken: string;
  dailyLimit: number;
  timezone: string;
  requireReview: boolean;
  webhookSecret: string;
};

function required(name: string, value: string | undefined) {
  if (!value?.trim()) throw new Error(`Missing email environment variable: ${name}`);
  return value.trim();
}

export function getEmailConfig(): EmailConfig {
  const provider = (process.env.MAIL_PROVIDER ?? "gmail") as EmailProvider;
  if (provider !== "gmail") throw new Error(`Unsupported email provider: ${provider}`);

  const dailyLimit = Number(process.env.OUTREACH_DAILY_LIMIT ?? "30");
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 500) {
    throw new Error("OUTREACH_DAILY_LIMIT must be an integer between 1 and 500");
  }

  return {
    provider,
    fromName: required("MAIL_FROM_NAME", process.env.MAIL_FROM_NAME),
    fromAddress: required("MAIL_FROM_ADDRESS", process.env.MAIL_FROM_ADDRESS),
    replyTo: process.env.MAIL_REPLY_TO?.trim() || required("MAIL_FROM_ADDRESS", process.env.MAIL_FROM_ADDRESS),
    gmailClientId: required("GMAIL_CLIENT_ID", process.env.GMAIL_CLIENT_ID),
    gmailClientSecret: required("GMAIL_CLIENT_SECRET", process.env.GMAIL_CLIENT_SECRET),
    gmailRefreshToken: required("GMAIL_REFRESH_TOKEN", process.env.GMAIL_REFRESH_TOKEN),
    dailyLimit,
    timezone: process.env.OUTREACH_TIMEZONE?.trim() || "Asia/Shanghai",
    requireReview: process.env.OUTREACH_REQUIRE_REVIEW === "true",
    webhookSecret: required("MAIL_WEBHOOK_SECRET", process.env.MAIL_WEBHOOK_SECRET),
  };
}

export function getEmailConfigStatus() {
  const requiredKeys = [
    "MAIL_FROM_NAME",
    "MAIL_FROM_ADDRESS",
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REFRESH_TOKEN",
    "MAIL_WEBHOOK_SECRET",
  ] as const;
  const missing = requiredKeys.filter((key) => !process.env[key]?.trim());

  return {
    provider: process.env.MAIL_PROVIDER ?? "gmail",
    fromAddress: process.env.MAIL_FROM_ADDRESS ?? null,
    configured: missing.length === 0,
    missing,
    dailyLimit: Number(process.env.OUTREACH_DAILY_LIMIT ?? "30"),
    timezone: process.env.OUTREACH_TIMEZONE ?? "Asia/Shanghai",
    requireReview: process.env.OUTREACH_REQUIRE_REVIEW === "true",
  };
}
