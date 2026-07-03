import type { DetectedObject, Inspiration, ProductCandidate, SearchPlan } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { embedTexts } from "./embedding-model";

export type RerankInput = {
  plan: SearchPlan;
  selectedObject?: DetectedObject | null;
  inspiration?: Inspiration | null;
  candidates: ProductCandidate[];
};

// Default blend: embeddings carry semantic/cross-lingual matching, lexical keeps a floor
// of exact keyword/category evidence. Tunable so the eval can sweep weights.
const DEFAULT_LEXICAL_WEIGHT = 0.4;
const DEFAULT_EMBEDDING_WEIGHT = 0.6;

// The local model needs onnxruntime-node, which requires the Node arch to match the
// installed binary (arm64). It's opt-in for the live server so an incompatible runtime
// (e.g. x64 Node under Rosetta) can never crash it; the eval calls rerankByEmbedding
// directly and is not gated.
export function isEmbeddingRerankEnabled(): boolean {
  return process.env.RERANK_EMBEDDINGS === "1";
}

// One text document describing the shopper's intent (plan + inspiration cues).
export function buildQueryDocument(
  plan: SearchPlan,
  selectedObject?: DetectedObject | null,
  inspiration?: Inspiration | null
): string {
  return [
    `Object: ${plan.objectLabel} (${plan.objectCategory})`,
    `Broad query: ${plan.broadQuery}`,
    `Room: ${plan.roomContext}`,
    `Must have: ${plan.mustHave.join(", ")}`,
    `Nice to have: ${plan.niceToHave.join(", ")}`,
    `Avoid: ${plan.avoid.join(", ")}`,
    selectedObject
      ? `Target object identity: ${selectedObject.label}; size ${selectedObject.attributes.sizeHint}`
      : "",
    inspiration
      ? `Style: ${inspiration.styleKeywords.join(", ")}; palette ${inspiration.colorPalette.join(
          ", "
        )}; materials ${inspiration.materials.join(", ")}; shapes ${inspiration.shapeKeywords.join(
          ", "
        )}; vibe ${inspiration.vibeNotes.join(", ")}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}

// One text document per product candidate (title + attributes + scraped body text).
export function buildCandidateDocument(candidate: ProductCandidate): string {
  return [
    `Retailer: ${candidate.retailer}`,
    `Title: ${candidate.title}`,
    `Price: ${candidate.priceText}`,
    candidate.extractedAttributes.length
      ? `Attributes: ${candidate.extractedAttributes.join(", ")}`
      : "",
    candidate.rawText ? `Text: ${candidate.rawText}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

// Both inputs are already L2-normalized, so the dot product is the cosine similarity.
export function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += (left[i] ?? 0) * (right[i] ?? 0);
  }
  return dot;
}

// Map raw similarities into [0,1] so they blend cleanly with the lexical score.
export function minMaxNormalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 1);
  return values.map((value) => (value - min) / (max - min));
}

// Pure scoring given precomputed similarities — shared by the live path and the eval
// harness so both blend identically.
export function blendScores(
  candidates: ProductCandidate[],
  similarities: number[],
  lexicalWeight = DEFAULT_LEXICAL_WEIGHT,
  embeddingWeight = DEFAULT_EMBEDDING_WEIGHT
): ProductCandidate[] {
  const normalized = minMaxNormalize(similarities);
  return candidates
    .map((candidate, index) => {
      const lexical = candidate.scoreBreakdown?.lexical ?? candidate.confidence;
      const embedding = normalized[index] ?? 0;
      const final = clamp(lexical * lexicalWeight + embedding * embeddingWeight);
      return {
        ...candidate,
        confidence: Number(final.toFixed(3)),
        scoreBreakdown: {
          ...candidate.scoreBreakdown,
          lexical: Number(lexical.toFixed(3)),
          embedding: Number(embedding.toFixed(3)),
          final: Number(final.toFixed(3))
        }
      } satisfies ProductCandidate;
    })
    .sort((left, right) => right.confidence - left.confidence);
}

// Rerank candidates by local multilingual embedding similarity to the query, blended
// with the existing lexical score. Falls back to the input order on model failure.
export async function rerankByEmbedding(
  input: RerankInput,
  weights?: { lexicalWeight?: number; embeddingWeight?: number }
): Promise<ProductCandidate[]> {
  const { plan, selectedObject, inspiration, candidates } = input;
  if (!candidates.length) return [];

  try {
    const queryDoc = buildQueryDocument(plan, selectedObject, inspiration);
    const candidateDocs = candidates.map(buildCandidateDocument);
    const [queryVector] = await embedTexts([queryDoc], "query");
    const candidateVectors = await embedTexts(candidateDocs, "passage");
    // Model unavailable / partial result — keep the incoming (lexical) order.
    if (!queryVector || candidateVectors.length !== candidates.length) {
      return candidates;
    }
    const similarities = candidateVectors.map((vector) => cosineSimilarity(queryVector, vector));
    return blendScores(
      candidates,
      similarities,
      weights?.lexicalWeight,
      weights?.embeddingWeight
    );
  } catch {
    return candidates;
  }
}
