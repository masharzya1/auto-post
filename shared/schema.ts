import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Shared Firebase-style settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  fbPageId: text("fb_page_id").notNull(),
  ytChannelId: text("yt_channel_id").notNull(),
  niche: text("niche").notNull(),
  postsPerWeek: integer("posts_per_week").notNull(),
  videosPerDay: integer("videos_per_day").notNull(),
  randomPostingTime: boolean("random_posting_time").default(false).notNull(),
});

// AI Usage Limits
export const limits = pgTable("limits", {
  id: serial("id").primaryKey(),
  textLimit: integer("text_limit").notNull(),
  imageLimit: integer("image_limit").notNull(),
  videoLimit: integer("video_limit").notNull(),
  textUsed: integer("text_used").default(0).notNull(),
  imageUsed: integer("image_used").default(0).notNull(),
  videoUsed: integer("video_used").default(0).notNull(),
  lastResetDate: timestamp("last_reset_date").defaultNow().notNull(),
});

// Workflows
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run"),
  status: text("status").default("idle").notNull(),
});

// Generated Content
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertLimitsSchema = createInsertSchema(limits).omit({ id: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, lastRun: true });
export const insertContentSchema = createInsertSchema(content).omit({ id: true, createdAt: true });

export type Settings = typeof settings.$inferSelect;
export type Limits = typeof limits.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Content = typeof content.$inferSelect;

export * from "./models/chat";
