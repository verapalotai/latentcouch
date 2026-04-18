import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { DetectedObject, Inspiration, ProductCandidate, SearchPlan } from "@/lib/types";
import { getOpenAIClient, getOpenAIEmbeddingModel, getOpenAIRerankModel } from "./client";
import { clamp, uniqueStrings } from "@/lib/utils";

const ProductRerankSchema = z.object({
  ranked: z.array(
    z.object({
      candidateId: z.string(),
      fitScore: z.number().min(0).max(1),
      reasons: z.array(z.string()).max(4)
    })
  )
});

type RerankInput = {
  plan: SearchPlan;
  selectedObject?: DetectedObject | null;
  inspiration?: Inspiration | null;
  candidates: ProductCandidate[];
};

export async function rerankProductCandidates({
  plan,
  selectedObject,
  inspiration,
  candidates
}: RerankInput): Promise<ProductCandidate[]> {
  if (!candidates.length) {
    return [];
  }

  const embeddingReranked = await scoreWithEmbeddings({
    plan,
    selectedObject,
    inspiration,
    candidates
  });

  const shortlist = embeddingReranked.slice(0, 12);
  const llmReranked = await scoreWithLLMReranker({
    plan,
    selectedObject,
    inspiration,
    candidates: shortlist
  });

  if (!llmReranked.length) {
    return embeddingReranked;
  }

  const llmByUrl = new Map(llmReranked.map((candidate) => [candidate.url, candidate]));

  return embeddingReranked
    .map((candidate) => {
      const llmCandidate = llmByUrl.get(candidate.url);
      if (!llmCandidate) {
        return candidate;
      }

      const lexical = candidate.scoreBreakdown?.lexical ?? candidate.confidence;
      const embedding = candidate.scoreBreakdown?.embedding ?? candidate.confidence;
      const llm = llmCandidate.scoreBreakdown?.llm ?? llmCandidate.confidence;
      const final = clamp(lexical * 0.2 + embedding * 0.25 + llm * 0.55);

      return {
        ...candidate,
        confidence: Number(final.toFixed(3)),
        matchReasons: uniqueStrings([...candidate.matchReasons, ...llmCandidate.matchReasons]).slice(0, 4),
        scoreBreakdown: {
          lexical: Number(lexical.toFixed(3)),
          embedding: Number(embedding.toFixed(3)),
          llm: Number(llm.toFixed(3)),
          final: Number(final.toFixed(3))
        }
      } satisfies ProductCandidate;
    })
    .sort((left, right) => right.confidence - left.confidence);
}

async function scoreWithEmbeddings({
  plan,
  selectedObject,
  inspiration,
  candidates
}: RerankInput): Promise<ProductCandidate[]> {
  const client = getOpenAIClient();

  if (!client) {
    return candidates;
  }

  try {
    const queryDocument = buildQueryDocument(plan, selectedObject, inspiration);
    const candidateDocuments = candidates.map((candidate) => buildCandidateDocument(candidate));
    const response = await client.embeddings.create({
      model: getOpenAIEmbeddingModel(),
      input: [queryDocument, ...candidateDocuments],
      encoding_format: "float"
    });

    const [queryEmbedding, ...candidateEmbeddings] = response.data.map((item) => item.embedding);
    const rawSimilarities = candidateEmbeddings.map((embedding) => cosineSimilarity(queryEmbedding, embedding));
    const normalizedSimilarities = normalizeRange(rawSimilarities);

    return candidates
      .map((candidate, index) => {
        const lexical = candidate.scoreBreakdown?.lexical ?? candidate.confidence;
        const embedding = normalizedSimilarities[index] ?? 0;
        const final = clamp(lexical * 0.55 + embedding * 0.45);

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
  } catch {
    return candidates;
  }
}

async function scoreWithLLMReranker({
  plan,
  selectedObject,
  inspiration,
  candidates
}: RerankInput): Promise<ProductCandidate[]> {
  const client = getOpenAIClient();

  if (!client || !candidates.length) {
    return [];
  }

  const candidatesWithIds = candidates.map((candidate, index) => ({
    candidate,
    candidateId: `candidate_${index + 1}`
  }));

  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "low" }
  > = [
    {
      type: "input_text",
      text: buildLLMRerankerPrompt(plan, selectedObject, inspiration, candidatesWithIds)
    }
  ];

  for (const { candidateId, candidate } of candidatesWithIds) {
    if (!candidate.imageUrl) {
      continue;
    }

    content.push({
      type: "input_text",
      text: `${candidateId} preview image`
    });
    content.push({
      type: "input_image",
      image_url: candidate.imageUrl,
      detail: "low"
    });
  }

  try {
    const response = await client.responses.parse({
      model: getOpenAIRerankModel(),
      input: [
        {
          role: "user",
          content
        }
      ],
      text: {
        format: zodTextFormat(ProductRerankSchema, "product_rerank")
      }
    });

    const parsed = ProductRerankSchema.parse(response.output_parsed);
    const byId = new Map(candidatesWithIds.map((entry) => [entry.candidateId, entry.candidate]));

    const scored = parsed.ranked
      .map((entry): ProductCandidate | null => {
        const candidate = byId.get(entry.candidateId);
        if (!candidate) {
          return null;
        }

        const lexical = candidate.scoreBreakdown?.lexical ?? candidate.confidence;
        const embedding = candidate.scoreBreakdown?.embedding ?? candidate.confidence;
        const llm = entry.fitScore;

        return {
          ...candidate,
          confidence: Number(llm.toFixed(3)),
          matchReasons: uniqueStrings([...entry.reasons, ...candidate.matchReasons]).slice(0, 4),
          scoreBreakdown: {
            lexical: Number(lexical.toFixed(3)),
            embedding: Number(embedding.toFixed(3)),
            llm: Number(llm.toFixed(3)),
            final: Number(llm.toFixed(3))
          }
        } satisfies ProductCandidate;
      })
      .filter((candidate): candidate is ProductCandidate => candidate !== null);

    return scored.sort((left, right) => right.confidence - left.confidence);
  } catch {
    return [];
  }
}

function buildQueryDocument(
  plan: SearchPlan,
  selectedObject?: DetectedObject | null,
  inspiration?: Inspiration | null
) {
  return [
    `Object label: ${plan.objectLabel}`,
    `Object category: ${plan.objectCategory}`,
    `Broad search query: ${plan.broadQuery}`,
    `Room context: ${plan.roomContext}`,
    `Must have: ${plan.mustHave.join(", ")}`,
    `Nice to have: ${plan.niceToHave.join(", ")}`,
    `Avoid: ${plan.avoid.join(", ")}`,
    `Retailer queries: ${plan.retailerQueries.map((entry) => `${entry.retailer}: ${entry.query}`).join(" | ")}`,
    selectedObject
      ? `Current room object: use this only to preserve the target object identity and rough scale. Label ${selectedObject.label}; size hint ${selectedObject.attributes.sizeHint}; notes ${selectedObject.notes.join(", ")}`
      : "",
    inspiration
      ? `Inspiration style: ${inspiration.styleKeywords.join(", ")}; palette ${inspiration.colorPalette.join(", ")}; materials ${inspiration.materials.join(", ")}; shapes ${inspiration.shapeKeywords.join(", ")}; vibe ${inspiration.vibeNotes.join(", ")}; avoid ${inspiration.avoidKeywords.join(", ")}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCandidateDocument(candidate: ProductCandidate) {
  return [
    `Retailer: ${candidate.retailer}`,
    `Title: ${candidate.title}`,
    `Price: ${candidate.priceText}`,
    `Attributes: ${candidate.extractedAttributes.join(", ")}`,
    `Body: ${candidate.rawText}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLLMRerankerPrompt(
  plan: SearchPlan,
  selectedObject: DetectedObject | null | undefined,
  inspiration: Inspiration | null | undefined,
  candidates: Array<{ candidateId: string; candidate: ProductCandidate }>
) {
  return [
    "You are a high-precision furniture reranker for a local shopping agent.",
    "Select the closest product matches for the user's target object.",
    "Use the room context, the inspiration cues, the retailer queries, the candidate texts, and the candidate images when available.",
    "Favor semantic fit over keyword overlap alone.",
    "Treat the current room photo as object-identification context, not style guidance.",
    "Do not copy colors or materials from the current room object unless they are essential to the product category itself.",
    "Let the inspiration images drive the aesthetic direction.",
    "Penalize wrong furniture categories, wrong room usage, and clashes with avoid cues.",
    "Return the candidates in best-to-worst order. Fit scores should reflect final shopping usefulness from 0 to 1.",
    "",
    "Search intent",
    buildQueryDocument(plan, selectedObject, inspiration),
    "",
    "Candidate set",
    ...candidates.map(
      ({ candidateId, candidate }) =>
        [
          `${candidateId}`,
          `Retailer: ${candidate.retailer}`,
          `Title: ${candidate.title}`,
          `Price: ${candidate.priceText}`,
          `Attributes: ${candidate.extractedAttributes.join(", ") || "n/a"}`,
          `Existing signals: lexical ${candidate.scoreBreakdown?.lexical ?? candidate.confidence}, embedding ${candidate.scoreBreakdown?.embedding ?? "n/a"}`,
          `Text: ${candidate.rawText}`,
          candidate.imageUrl ? `Image included after this block for ${candidateId}` : "No product image provided"
        ].join("\n")
    ),
    "",
    "Rules",
    "- Keep at most 8 candidates in the final ranked list.",
    "- Use short, concrete reasons tied to style, category fit, material, silhouette, room use, or obvious visual mismatch.",
    "- Do not hallucinate missing dimensions or brand claims."
  ].join("\n");
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function normalizeRange(values: number[]) {
  if (!values.length) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return values.map(() => 1);
  }

  return values.map((value) => (value - min) / (max - min));
}
