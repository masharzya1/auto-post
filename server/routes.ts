import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/image/client";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  registerChatRoutes(app);
  registerImageRoutes(app);

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
    const settings = await storage.getSettings();
    const niche = settings?.niche || "General";
    
    let generatedData = {};
    
    try {
      if (type === "text") {
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [{ role: "user", content: `Write a social media post for the ${niche} niche.` }],
        });
        generatedData = { text: response.choices[0].message.content };
      } else if (type === "image") {
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: `A professional image for a social media post in the ${niche} niche.`,
        });
        generatedData = { url: response.data[0].url, prompt: response.data[0].revised_prompt };
      }

      const c = await storage.createContent({ 
        type, 
        data: generatedData, 
        status: "ready" 
      });

      // Update limits
      const limits = await storage.getLimits();
      if (limits) {
        await storage.updateLimits({
          textUsed: type === "text" ? (limits.textUsed || 0) + 1 : limits.textUsed,
          imageUsed: type === "image" ? (limits.imageUsed || 0) + 1 : limits.imageUsed,
        });
      }

      res.json(c);
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
