import type { FeatureExtractionPipeline } from "@huggingface/transformers";

// Local multilingual sentence-embedding model. Runs in-process (Node via onnxruntime,
// browser via WASM/WebGPU) — no external API, no per-call cost.
//
// Default is multilingual-e5-small: ~118M params, strong Hungarian↔English retrieval,
// small enough to load in a serverless-ish process and even in the browser. Swap via
// EMBEDDING_MODEL (e.g. "Xenova/bge-m3" for the heavier, higher-quality option used in
// the eval write-up).
const DEFAULT_MODEL = "Xenova/multilingual-e5-small";

export function getEmbeddingModelId(): string {
  return process.env.EMBEDDING_MODEL || DEFAULT_MODEL;
}

let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;
let disabled = false;

function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (disabled) return Promise.reject(new Error("embedding model unavailable"));
  if (!pipelinePromise) {
    // Dynamic import so the heavy native module (onnxruntime-node) is only loaded at
    // request time — never during `next build`'s page-data collection. If it can't load
    // (e.g. arch mismatch), disable permanently so we don't retry and risk crashing.
    pipelinePromise = import("@huggingface/transformers")
      .then(({ pipeline }) => pipeline("feature-extraction", getEmbeddingModelId()))
      .catch((error) => {
        disabled = true;
        pipelinePromise = null;
        throw error;
      });
  }
  return pipelinePromise;
}

// e5 models are trained with "query:" / "passage:" prefixes; applying them is required
// for good asymmetric retrieval. Harmless to gate on the model id so other models skip it.
function withPrefix(texts: string[], kind: "query" | "passage"): string[] {
  if (getEmbeddingModelId().toLowerCase().includes("e5")) {
    return texts.map((text) => `${kind}: ${text}`);
  }
  return texts;
}

// Returns L2-normalized mean-pooled embeddings, one row per input text.
// Returns [] on any failure (missing model, load error) so callers can fall back
// gracefully instead of throwing.
export async function embedTexts(
  texts: string[],
  kind: "query" | "passage"
): Promise<number[][]> {
  if (!texts.length) return [];
  try {
    const extractor = await getPipeline();
    const output = await extractor(withPrefix(texts, kind), {
      pooling: "mean",
      normalize: true
    });
    return output.tolist() as number[][];
  } catch {
    return [];
  }
}
