import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.post("/api/content/generate", async (req, res) => {
  const { type, niche, model, apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: "API Key required" });

  try {
    if (type === "text") {
      const prompt = `Write a social media caption about ${niche}.`;
      let text = "";
      if (model.includes("gpt")) {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
          model, messages: [{ role: "user", content: prompt }]
        });
        text = response.choices[0]?.message?.content || "";
      } else if (model.includes("claude")) {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model, max_tokens: 1024, messages: [{ role: "user", content: prompt }]
        });
        text = response.content[0].type === 'text' ? response.content[0].text : "";
      } else if (model.includes("gemini")) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const result = await genAI.getGenerativeModel({ model }).generateContent(prompt);
        text = result.response.text();
      }
      res.json({ text, hashtags: [niche] });
    } else {
      res.json({ url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from "dist"
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));

export default app;
