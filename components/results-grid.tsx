import type { ProductCandidate } from "@/lib/types";
import { ActivityIndicator } from "./activity-indicator";
import { ProductCard } from "./product-card";

export function ResultsGrid({ results, loading }: { results: ProductCandidate[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-5">
        <ActivityIndicator inline label="Searching retailer sites and ranking matches..." />
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-5 text-sm text-[var(--muted)]">
        No products yet. Select a detected object to generate retailer searches.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {results.map((result) => (
        <ProductCard key={`${result.retailer}-${result.url}`} product={result} />
      ))}
    </div>
  );
}
