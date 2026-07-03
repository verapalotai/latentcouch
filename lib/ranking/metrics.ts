// Standard ranking-quality metrics used by the reranker eval harness.
// All operate on an array of graded relevance labels (0..3) in *ranked order*.

export function dcgAtK(relevances: number[], k: number): number {
  let dcg = 0;
  for (let i = 0; i < Math.min(k, relevances.length); i += 1) {
    dcg += (2 ** relevances[i] - 1) / Math.log2(i + 2);
  }
  return dcg;
}

// Normalized DCG: how close the ranking is to the ideal ordering (1.0 = perfect).
export function ndcgAtK(rankedRelevances: number[], k: number): number {
  const ideal = [...rankedRelevances].sort((a, b) => b - a);
  const idcg = dcgAtK(ideal, k);
  return idcg === 0 ? 0 : dcgAtK(rankedRelevances, k) / idcg;
}

// Fraction of the top-k that clear the relevance threshold (default: grade >= 2).
export function precisionAtK(rankedRelevances: number[], k: number, threshold = 2): number {
  const top = rankedRelevances.slice(0, k);
  if (!top.length) return 0;
  return top.filter((relevance) => relevance >= threshold).length / top.length;
}

// Reciprocal rank of the first relevant result (0 if none clear the threshold).
export function reciprocalRank(rankedRelevances: number[], threshold = 2): number {
  const index = rankedRelevances.findIndex((relevance) => relevance >= threshold);
  return index === -1 ? 0 : 1 / (index + 1);
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
