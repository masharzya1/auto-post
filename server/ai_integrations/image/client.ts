import OpenAI from "openai";
import { storage } from "../../storage";

export async function getOpenAIInstance(): Promise<OpenAI> {
  const settings = await storage.getSettings();
  const apiKey = settings?.openaiApiKey;

  if (!apiKey) {
    throw new Error("OpenAI API Key is missing. Please provide it in the Settings page.");
  }

  return new OpenAI({
    apiKey,
  });
}

/**
 * Generate an image and return as Buffer.
 * Uses gpt-image-1 model via Platform AI Integrations.
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const response = await (await getOpenAIInstance()).images.generate({
    model: "gpt-image-1",
    prompt,
    size,
  });
  const base64 = response?.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses gpt-image-1 model via Platform AI Integrations.
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const response = await (await getOpenAIInstance()).images.edit({
    model: "gpt-image-1",
    image: images,
    prompt,
  });

  const imageBase64 = response?.data?.[0]?.b64_json ?? "";
  const imageBytes = Buffer.from(imageBase64, "base64");

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}

