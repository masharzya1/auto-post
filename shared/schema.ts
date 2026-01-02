import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  fbPageId: text("fb_page_id").notNull(),
  ytChannelId: text("yt_channel_id").notNull(),
  niche: text("niche").notNull(),
  postsPerWeek: integer("posts_per_week").notNull(),
  videosPerDay: integer("videos_per_day").notNull(),
  randomPostingTime: boolean("random_posting_time").default(false).notNull(),
  
  photoModel: text("photo_model").default("gpt-image-1").notNull(),
  captionModel: text("caption_model").default("gpt-4o-mini").notNull(),
  videoModel: text("video_model").default("luma-dream-machine").notNull(),
  
  fbAccessToken: text("fb_access_token"),
  openaiApiKey: text("openai_api_key"),
  geminiApiKey: text("gemini_api_key"),
  claudeApiKey: text("claude_api_key"),
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
  cronSchedule: text("cron_schedule").default("0 9 * * *").notNull(),
  contentType: text("content_type").default("text").notNull(),
  includeHashtags: boolean("include_hashtags").default(true).notNull(),
  runsPerDay: integer("runs_per_day").default(1).notNull(),
  postingTimes: text("posting_times").array(),
  niche: text("niche"),
});

// Enhanced Content Table with Analytics
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  status: text("status").default("draft").notNull(), // draft, ready, scheduled, deployed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  scheduledFor: timestamp("scheduled_for"),
  deployedAt: timestamp("deployed_at"),
  
  // Analytics
  platformPostId: text("platform_post_id"), // FB/YT post ID
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
});

// Content Schedule Queue
export const contentQueue = pgTable("content_queue", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => content.id).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  attempts: integer("attempts").default(0).notNull(),
  lastAttempt: timestamp("last_attempt"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  platformId: text("platform_id").notNull(),
  content: text("content").notNull(),
  response: text("response"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertLimitsSchema = createInsertSchema(limits).omit({ id: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, lastRun: true });
export const insertContentSchema = createInsertSchema(content).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentQueueSchema = createInsertSchema(contentQueue).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true });

// Types
export type Settings = typeof settings.$inferSelect;
export type Limits = typeof limits.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Content = typeof content.$inferSelect;
export type ContentQueue = typeof contentQueue.$inferSelect;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export const api = {
  settings: { get: { path: "/api/settings" }, update: { path: "/api/settings" } },
  limits: { get: { path: "/api/limits" }, update: { path: "/api/limits" } },
  workflows: { list: { path: "/api/workflows" }, toggle: { path: "/api/workflows/:id/toggle" } },
  content: { list: { path: "/api/content" }, generate: { path: "/api/content/generate" } },
};
