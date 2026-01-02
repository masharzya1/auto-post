import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { content, workflows, users, api } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Mock integrations for demo stability
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

  app.post(api.content.generate.path, async (req, res) => {
    const { type } = req.body;
    const s = await storage.getSettings();
    const l = await storage.getLimits();

    try {
      let data: any = {};
      if (type === "text") {
        data = { text: `AI Generated Caption for ${s?.niche || 'Universal'} niche. #trending #automation`, hashtags: ["trending", "automation"] };
        await storage.updateLimits({ textUsed: (l?.textUsed || 0) + 1 });
      } else if (type === "image") {
        data = { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe", prompt: "Abstract digital art" };
        await storage.updateLimits({ imageUsed: (l?.imageUsed || 0) + 1 });
      }
      
      const created = await storage.createContent({
        type,
        workflowId: null,
        data,
        status: "ready"
      });
      res.json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/content/:id/post", async (req, res) => {
    try {
      const [item] = await db.select().from(content).where(eq(content.id, Number(req.params.id)));
      if (!item) return res.status(404).json({ error: "Content not found" });
      const s = await storage.getSettings();
      if (!s?.fbAccessToken || !s?.fbPageId) return res.status(400).json({ error: "Facebook configuration is missing. Please check your settings." });

      const data = item.data as any;
      const result = await postToFacebook(s.fbPageId, s.fbAccessToken, data.text || data.prompt || "", data.url);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

const postToFacebook = async (pageId: string, accessToken: string, message: string, imageUrl?: string) => {
  const endpoint = imageUrl ? `https://graph.facebook.com/v18.0/${pageId}/photos` : `https://graph.facebook.com/v18.0/${pageId}/feed`;
  const params = new URLSearchParams({ 
    message, 
    access_token: accessToken,
    published: "true",
  });
  
  if (imageUrl) {
    params.append("url", imageUrl);
  }

  const response = await fetch(`${endpoint}?${params.toString()}`, { method: "POST" });
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || "Facebook API error");
  }
  return result;
};
