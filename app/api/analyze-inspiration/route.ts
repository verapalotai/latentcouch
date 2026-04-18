import { NextResponse } from "next/server";
import { analyzeInspirationImages } from "@/lib/openai/analyze-inspiration";
import { fileToDataUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images").filter((value): value is File => value instanceof File);

    const images = await Promise.all(files.map(fileToDataUrl));
    const inspiration = await analyzeInspirationImages(images);

    return NextResponse.json(inspiration);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze inspiration photos"
      },
      { status: 500 }
    );
  }
}
