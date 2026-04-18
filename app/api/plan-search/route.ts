import { NextResponse } from "next/server";
import { planRetailSearch } from "@/lib/openai/plan-search";
import { DetectedObjectSchema, InspirationSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selectedObject = DetectedObjectSchema.parse(body.selectedObject);
    const inspiration = InspirationSchema.parse(body.inspiration);

    const plan = await planRetailSearch(selectedObject, inspiration);

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to build search plan"
      },
      { status: 500 }
    );
  }
}
