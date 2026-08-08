import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  country: text("country").notNull(),
  product: text("product").notNull(),
  exclusions: text("exclusions").notNull().default(""),
  targetCount: integer("target_count").notNull().default(20),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  company: text("company").notNull(),
  website: text("website"),
  country: text("country").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  fitScore: integer("fit_score").notNull().default(0),
  evidence: text("evidence").notNull().default("[]"),
  status: text("status").notNull().default("discovered"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  channel: text("channel").notNull().default("email"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull().default("draft"),
  scheduledAt: text("scheduled_at"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: integer("message_id").notNull().references(() => messages.id),
  type: text("type").notNull(),
  payload: text("payload").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
