import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/image/client";
import { db } from "./db";
import { content, workflows, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Sync user from Firebase to local DB
  app.post("/api/auth/sync", async (req, res) => {
    const { uid, email } = req.body;
    if (!uid || !email) return res.status(400).send("Missing data");
    
    const [existing] = await db.select().from(users).where(eq(users.firebaseUid, uid));
    if (existing) {
      const [updated] = await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, existing.id)).returning();
      return res.json(updated);
    }
    const [created] = await db.insert(users).values({ firebaseUid: uid, email }).returning();
    res.json(created);
  });

  app.get(api.settings.get.path, async (req, res) => {
    const s = await storage.getSettings();
    res.json(s || {});
  });

  app.post(api.settings.update.path, async (req, res) => {
    const s = await storage.updateSettings(req.body);
    res.json(s);
  });

  app.get(api.limits.get.path, async (req, res) => {
    const l = await storage.getLimits();
    res.json(l || { textLimit: 100, imageLimit: 50, videoLimit: 10, textUsed: 0, imageUsed: 0, videoUsed: 0 });
  });

  app.post(api.limits.update.path, async (req, res) => {
    const l = await storage.updateLimits(req.body);
    res.json(l);
  });

  app.get(api.workflows.list.path, async (req, res) => {
    const w = await storage.getWorkflows();
    res.json(w);
  });

  app.post(api.workflows.toggle.path, async (req, res) => {
    const w = await storage.updateWorkflow(Number(req.params.id), req.body.enabled);
    res.json(w);
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    const { id } = req.params;
    const { cronSchedule } = req.body;
    const [updated] = await db.update(workflows).set({ cronSchedule }).where(eq(workflows.id, Number(id))).returning();
    res.json(updated);
  });

  app.get(api.content.list.path, async (req, res) => {
    const c = await storage.getContent();
    res.json(c);
  });

  app.delete("/api/content/:id", async (req, res) => {
    await storage.deleteContent(Number(req.params.id));
    res.sendStatus(204);
  });

  app.post("/api/content/:id/post", async (req, res) => {
    try {
      const [item] = await db.select().from(content).where(eq(content.id, Number(req.params.id)));
      if (!item) return res.status(404).json({ error: "Content not found" });
      const settings = await storage.getSettings();
      if (!settings?.fbAccessToken || !settings?.fbPageId) return res.status(400).json({ error: "FB config missing" });

      const data = item.data as any;
      const result = await postToFacebook(settings.fbPageId, settings.fbAccessToken, data.text || data.prompt || "", data.url);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

const postToFacebook = async (pageId: string, accessToken: string, message: string, imageUrl?: string) => {
  const baseUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
  const params = new URLSearchParams({ message, access_token: accessToken });
  if (imageUrl) params.append("url", imageUrl);
  const response = await fetch(`${baseUrl}?${params.toString()}`, { method: "POST" });
  if (!response.ok) throw new Error("Facebook API error");
  return response.json();
};
