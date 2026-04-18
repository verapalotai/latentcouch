import { NextResponse } from "next/server";
import { rerankProductCandidates } from "@/lib/openai/rerank-products";
import { rankCandidates } from "@/lib/ranking/rank-candidates";
import { retailerAdapters } from "@/lib/retailers";
import { DetectedObjectSchema, InspirationSchema, SearchPlanSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const plan = SearchPlanSchema.parse(body.plan || body);
    const selectedObject = body.selectedObject ? DetectedObjectSchema.parse(body.selectedObject) : null;
    const inspiration = body.inspiration ? InspirationSchema.parse(body.inspiration) : null;

    const settled = await Promise.all(
      plan.retailerQueries.map(async ({ retailer, query }) => {
        const adapter = retailerAdapters[retailer];

        if (!adapter) {
          return {
            retailer,
            ok: false,
            resultCount: 0,
            candidates: [],
            error: "No adapter configured"
          };
        }

        const result = await adapter.search({
          query,
          objectLabel: plan.objectLabel,
          objectCategory: plan.objectCategory,
          broadQuery: plan.broadQuery
        });

        return {
          retailer,
          ok: !result.error && result.candidates.length > 0,
          resultCount: result.candidates.length,
          candidates: result.candidates,
          error: result.error,
          manualSearchUrl: result.manualSearchUrl
        };
      })
    );

    const lexicalRanked = dedupeByUrl(
      rankCandidates(
        plan,
        settled.flatMap((entry) => entry.candidates)
      )
    );

    const reranked = await rerankProductCandidates({
      plan,
      selectedObject,
      inspiration,
      candidates: lexicalRanked.slice(0, 24)
    });

    const ranked = (reranked.length ? reranked : lexicalRanked).slice(0, 18);

    return NextResponse.json({
      results: ranked,
      storeStatuses: settled.map(({ retailer, ok, resultCount, error, manualSearchUrl }) => ({
        retailer,
        ok,
        resultCount,
        error,
        manualSearchUrl
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to search retailer sites"
      },
      { status: 500 }
    );
  }
}

function dedupeByUrl<T extends { url: string }>(results: T[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.url)) {
      return false;
    }
    seen.add(result.url);
    return true;
  });
}
