import { NextResponse } from "next/server";
import { analyzeRoomImages } from "@/lib/openai/analyze-room";
import { fileToDataUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images").filter((value): value is File => value instanceof File);

    const images = await Promise.all(files.map(fileToDataUrl));
    const roomObjects = await analyzeRoomImages(images);

    return NextResponse.json(roomObjects);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze room photos"
      },
      { status: 500 }
    );
  }
}
