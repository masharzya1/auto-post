import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

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

  app.post(api.content.generate.path, async (req, res) => {
    const { type } = req.body;
    const c = await storage.createContent({ 
      type, 
      data: { prompt: `Generated ${type} content` }, 
      status: "ready" 
    });
    res.json(c);
  });

  return httpServer;
}
