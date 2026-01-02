import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import "../server/firebase";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  // Pass null or a dummy server for Vercel serverless environment
  await registerRoutes(null as any, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
})();

export default app;
