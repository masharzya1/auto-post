import { z } from "zod";
import { insertSettingsSchema, insertLimitsSchema, insertWorkflowSchema, insertContentSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  settings: {
    get: { method: "GET", path: "/api/settings" },
    update: { method: "POST", path: "/api/settings", input: insertSettingsSchema },
  },
  limits: {
    get: { method: "GET", path: "/api/limits" },
    update: { method: "POST", path: "/api/limits", input: insertLimitsSchema.partial() },
  },
  workflows: {
    list: { method: "GET", path: "/api/workflows" },
    toggle: { method: "POST", path: "/api/workflows/:id/toggle", input: z.object({ enabled: z.boolean() }) },
  },
  content: {
    list: { method: "GET", path: "/api/content" },
    generate: { method: "POST", path: "/api/content/generate", input: z.object({ type: z.enum(["text", "image", "video"]) }) },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
