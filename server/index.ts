import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cron from "node-cron";
import { storage } from "./storage";
import { getOpenAIInstance } from "./ai_integrations/image/client";
import "./firebase-config"; // Initialize Firebase
const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Cron Job for Automation
  cron.schedule("0 9 * * *", async () => {
    log("Running scheduled automation check...", "cron");
    try {
      const workflows = await storage.getWorkflows();
      const settings = await storage.getSettings();
      if (!settings) return;

      for (const workflow of workflows) {
        if (workflow.enabled) {
          log(`Executing workflow: ${workflow.name}`, "cron");
          try {
            const openai = await getOpenAIInstance();
            const response = await openai.chat.completions.create({
              model: settings.captionModel,
              messages: [{ role: "user", content: `Generate a scheduled post for ${settings.niche}` }],
            });
            
            await storage.createContent({
              workflowId: workflow.id,
              type: "text",
              data: { text: response.choices[0].message.content },
              status: "ready"
            });
            
            log(`Workflow ${workflow.name} completed successfully`, "cron");
          } catch (error) {
            log(`Workflow ${workflow.name} failed: ${error}`, "cron");
          }
        }
      }
    } catch (error) {
      log(`Cron execution failed: ${error}`, "cron");
    }
  });
})();
