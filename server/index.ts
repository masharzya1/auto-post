import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const { type, niche, model, provider } = req.body;
  
  // In a real app, API keys should come from environment variables (Secrets)
  // For this demo, we'll use placeholders that the user would set up in Replit Secrets
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    return res.status(400).json({ error: `API Key for ${provider} not configured in server secrets.` });
  }

  try {
    let result;
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      if (type === "text") {
        const response = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: `Write a social media caption about ${niche}.` }]
        });
        result = { text: response.choices[0].message.content };
      } else {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `${niche} themed photography`,
        });
        result = { url: response.data[0].url };
      }
    } else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: `Write a social media caption about ${niche}.` }]
      });
      result = { text: response.content[0].text };
    } else if (provider === "google") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model });
      const response = await genModel.generateContent(`Write a social media caption about ${niche}.`);
      result = { text: response.response.text() };
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure proxy running on port ${PORT}`));
