/**
 * Reranker evaluation harness.
 *
 * Compares three ranking strategies on a labeled set, reporting nDCG@5, P@3 and MRR:
 *   1. lexical-only   — the keyword/category scorer (baseline)
 *   2. embedding-only — local multilingual embeddings only
 *   3. blend          — lexical + embeddings (production default)
 *
 * Run:  pnpm exec tsx scripts/eval-rerank.ts [path/to/dataset.json]
 * Default dataset: lib/ranking/eval/sample.json
 *
 * Needs the local embedding model (downloads on first run). Set EMBEDDING_MODEL to try
 * a different model, e.g. EMBEDDING_MODEL=Xenova/bge-m3 pnpm exec tsx scripts/eval-rerank.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DetectedObject, Inspiration, ProductCandidate, SearchPlan } from "../lib/types";
import { scoreCandidatesLexically } from "../lib/ranking/rank-candidates";
import { rerankByEmbedding } from "../lib/ranking/embedding-rerank";
import { mean, ndcgAtK, precisionAtK, reciprocalRank } from "../lib/ranking/metrics";

type LabeledCandidate = ProductCandidate & { relevance: number };
type EvalCase = {
  name: string;
  plan: SearchPlan;
  selectedObject?: DetectedObject | null;
  inspiration?: Inspiration | null;
  candidates: LabeledCandidate[];
};
type Dataset = { cases: EvalCase[] };

const NDCG_K = 5;
const P_K = 3;

function relevanceInOrder(ranked: ProductCandidate[], labels: Map<string, number>): number[] {
  return ranked.map((candidate) => labels.get(candidate.url) ?? 0);
}

function scoreOrdering(ranked: ProductCandidate[], labels: Map<string, number>) {
  const grades = relevanceInOrder(ranked, labels);
  return {
    ndcg: ndcgAtK(grades, NDCG_K),
    precision: precisionAtK(grades, P_K),
    mrr: reciprocalRank(grades)
  };
}

async function main() {
  const datasetPath = resolve(process.argv[2] || "lib/ranking/eval/sample.json");
  const dataset = JSON.parse(readFileSync(datasetPath, "utf8")) as Dataset;

  const results = { lexical: [] as ReturnType<typeof scoreOrdering>[], embedding: [] as ReturnType<typeof scoreOrdering>[], blend: [] as ReturnType<typeof scoreOrdering>[] };

  for (const evalCase of dataset.cases) {
    const labels = new Map(evalCase.candidates.map((c) => [c.url, c.relevance]));
    const base = { plan: evalCase.plan, selectedObject: evalCase.selectedObject, inspiration: evalCase.inspiration };

    // 1. lexical-only order
    const lexical = scoreCandidatesLexically(evalCase.plan, evalCase.candidates);
    // 2. embedding-only (weights 0/1) and 3. blend (production default), both fed the lexical scores
    const embeddingOnly = await rerankByEmbedding({ ...base, candidates: lexical }, { lexicalWeight: 0, embeddingWeight: 1 });
    const blend = await rerankByEmbedding({ ...base, candidates: lexical });

    results.lexical.push(scoreOrdering(lexical, labels));
    results.embedding.push(scoreOrdering(embeddingOnly, labels));
    results.blend.push(scoreOrdering(blend, labels));

    console.log(`· ${evalCase.name}`);
  }

  const row = (label: string, rows: ReturnType<typeof scoreOrdering>[]) =>
    `${label.padEnd(16)} ${mean(rows.map((r) => r.ndcg)).toFixed(3).padStart(8)} ${mean(rows.map((r) => r.precision)).toFixed(3).padStart(7)} ${mean(rows.map((r) => r.mrr)).toFixed(3).padStart(6)}`;

  console.log(`\nDataset: ${datasetPath}`);
  console.log(`Model:   ${process.env.EMBEDDING_MODEL || "Xenova/multilingual-e5-small"}`);
  console.log(`Cases:   ${dataset.cases.length}\n`);
  console.log(`${"strategy".padEnd(16)} ${`nDCG@${NDCG_K}`.padStart(8)} ${`P@${P_K}`.padStart(7)} ${"MRR".padStart(6)}`);
  console.log("-".repeat(40));
  console.log(row("lexical-only", results.lexical));
  console.log(row("embedding-only", results.embedding));
  console.log(row("blend (0.4/0.6)", results.blend));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
