import { zodTextFormat } from "openai/helpers/zod";
import { RoomObjectsSchema, type ImageInput, type RoomObjects } from "@/lib/types";
import { getOpenAIClient, getOpenAIModel } from "./client";

export async function analyzeRoomImages(images: ImageInput[]): Promise<RoomObjects> {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local to analyze room photos.");
  }

  if (images.length === 0) {
    throw new Error("Upload at least one room photo.");
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
              "Analyze these room photos for furniture shopping. Return only the main visible furniture or decor objects a user may want to replace or buy around. Use consumer-friendly labels such as sofa, rug, coffee table, dining chair, pendant lamp, sideboard, shelving unit, or bar stool. Do not invent hidden details."
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
      format: zodTextFormat(RoomObjectsSchema, "room_objects")
    }
  });

  return RoomObjectsSchema.parse(response.output_parsed);
}
