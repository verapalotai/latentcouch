import { zodTextFormat } from "openai/helpers/zod";
import { InspirationSchema, type ImageInput, type Inspiration } from "@/lib/types";
import { getOpenAIClient, getOpenAIModel } from "./client";

export async function analyzeInspirationImages(images: ImageInput[]): Promise<Inspiration> {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local to analyze inspiration photos.");
  }

  if (images.length === 0) {
    throw new Error("Upload at least one inspiration photo.");
  }

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analyze these interior inspiration images for furniture shopping. Extract the overall style keywords, palette, materials, shapes, vibe notes, and avoid keywords. Also return `objects`: the distinct furniture/decor pieces visible in the inspiration, each with the DESIRED attributes shown there (colors, materials, shapes, styleHints, sizeHint) — these describe what the shopper wants to buy. Use consumer-friendly labels (sofa, vanity unit, coffee table, pendant lamp, etc.); do not invent hidden details. Keep everything concise, practical, and shopping-oriented."
          },
          ...images.map((image) => ({
            type: "input_image" as const,
            image_url: `data:${image.mimeType};base64,${image.dataBase64}`,
            detail: "low" as const
          }))
        ]
      }
    ],
    text: {
      format: zodTextFormat(InspirationSchema, "inspiration_style")
    }
  });

  return InspirationSchema.parse(response.output_parsed);
}
