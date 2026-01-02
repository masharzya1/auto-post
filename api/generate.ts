import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, niche, model, provider, apiKey } = req.body;
  
  if (!type || !niche || !model || !provider || !apiKey) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['type', 'niche', 'model', 'provider', 'apiKey']
    });
  }

  try {
    let result: any = {};

    // ========== OpenAI Integration ==========
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey });
      
      if (type === "text") {
        const response = await openai.chat.completions.create({
          model: model || "gpt-4o-mini",
          messages: [{ 
            role: "user", 
            content: `Write an engaging social media caption about ${niche}. Make it catchy and include 5-8 relevant hashtags at the end. Format: Caption text first, then hashtags on a new line starting with #.` 
          }],
          temperature: 0.8,
          max_tokens: 300
        });
        
        const generatedText = response.choices[0].message.content || "";
        const lines = generatedText.trim().split("\n");
        let hashtags: string[] = [];
        let captionLines: string[] = [];
        
        for (const line of lines) {
          if (line.trim().startsWith("#")) {
            hashtags.push(...line.split(" ").filter(t => t.startsWith("#")).map(h => h.replace("#", "")));
          } else if (line.trim()) {
            captionLines.push(line);
          }
        }
        
        result = { 
          text: captionLines.join("\n") || `Amazing ${niche} content!`,
          hashtags: hashtags.length ? hashtags : [niche.toLowerCase(), "trending", "viral", "ai", "motivation"]
        };
      } 
      else if (type === "image") {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional ${niche} themed image: high quality, vibrant colors, modern aesthetic, 8k resolution, studio lighting, trending on social media`,
          size: "1024x1024",
          quality: "hd"
        });
        result = { 
          url: response.data[0].url,
          prompt: `${niche} - AI Generated`,
          revised_prompt: response.data[0].revised_prompt
        };
      }
    } 
    
    // ========== Anthropic Claude Integration ==========
    else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey });
      
      if (type === "text") {
        const response = await anthropic.messages.create({
          model: model || "claude-3-5-sonnet-20241022",
          max_tokens: 300,
          temperature: 0.8,
          messages: [{ 
            role: "user", 
            content: `Write an engaging social media caption about ${niche}. Make it catchy and include 5-8 relevant hashtags at the end. Format: Caption text first, then hashtags on a new line starting with #.` 
          }]
        });
        
        const generatedText = response.content[0].type === 'text' ? response.content[0].text : "";
        const lines = generatedText.trim().split("\n");
        let hashtags: string[] = [];
        let captionLines: string[] = [];
        
        for (const line of lines) {
          if (line.trim().startsWith("#")) {
            hashtags.push(...line.split(" ").filter(t => t.startsWith("#")).map(h => h.replace("#", "")));
          } else if (line.trim()) {
            captionLines.push(line);
          }
        }
        
        result = { 
          text: captionLines.join("\n") || `Amazing ${niche} content!`,
          hashtags: hashtags.length ? hashtags : [niche.toLowerCase(), "trending", "viral", "ai", "inspiration"]
        };
      }
      else if (type === "image") {
        return res.status(400).json({ 
          error: "Claude does not support image generation. Please use OpenAI (DALL-E 3) for images." 
        });
      }
    } 
    
    // ========== Google Gemini Integration ==========
    else if (provider === "google") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ 
        model: model.includes("pro") ? "gemini-1.5-pro" : "gemini-1.5-flash" 
      });
      
      if (type === "text") {
        const response = await geminiModel.generateContent({
          contents: [{
            role: "user",
            parts: [{
              text: `Write an engaging social media caption about ${niche}. Make it catchy and include 5-8 relevant hashtags at the end. Format: Caption text first, then hashtags on a new line starting with #.`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300
          }
        });
        
        const generatedText = response.response.text();
        const lines = generatedText.trim().split("\n");
        let hashtags: string[] = [];
        let captionLines: string[] = [];
        
        for (const line of lines) {
          if (line.trim().startsWith("#")) {
            hashtags.push(...line.split(" ").filter(t => t.startsWith("#")).map(h => h.replace("#", "")));
          } else if (line.trim()) {
            captionLines.push(line);
          }
        }
        
        result = { 
          text: captionLines.join("\n") || `Amazing ${niche} content!`,
          hashtags: hashtags.length ? hashtags : [niche.toLowerCase(), "trending", "viral", "ai", "success"]
        };
      }
      else if (type === "image") {
        return res.status(400).json({ 
          error: "Gemini does not support image generation. Please use OpenAI (DALL-E 3) for images." 
        });
      }
    } 
    else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error("Generation error:", error);
    return res.status(500).json({ 
      error: error.message || "Content generation failed",
      details: error.response?.data || error.stack,
      provider,
      type
    });
  }
}
