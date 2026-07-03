import type { ProductCandidate } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCandidate }) {
  return (
    <a
      className="glass-panel block overflow-hidden rounded-[1.75rem] p-3 transition hover:-translate-y-1"
      href={product.url}
      rel="noreferrer"
      target="_blank"
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-white/70">
        {product.imageUrl ? (
          <img alt={product.title} className="h-52 w-full object-cover" src={product.imageUrl} />
        ) : (
          <div className="flex h-52 items-center justify-center bg-[var(--accent-soft)] text-sm text-[var(--muted)]">
            Preview unavailable
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          {product.retailer}
        </span>
        <span className="text-xs text-[var(--muted)]">{Math.round(product.confidence * 100)}% fit</span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-lg font-semibold">{product.title}</h3>
      <p className="mt-2 text-sm text-[var(--accent-strong)]">{product.priceText}</p>

      <p className="mt-3 text-sm text-[var(--muted)]">{product.matchReasons.join(" • ") || "Matched by title and extracted attributes."}</p>

      {product.scoreBreakdown &&
      (product.scoreBreakdown.embedding !== undefined ||
        product.scoreBreakdown.lexical !== undefined) ? (
        <div className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3">
          <ScoreBar label="Semantic" value={product.scoreBreakdown.embedding ?? 0} tone="accent" />
          <ScoreBar label="Keyword" value={product.scoreBreakdown.lexical ?? 0} tone="muted" />
        </div>
      ) : null}
    </a>
  );
}

function ScoreBar({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 flex-none text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor:
              tone === "accent"
                ? "var(--accent)"
                : "color-mix(in srgb, var(--muted) 55%, transparent)"
          }}
        />
      </span>
      <span className="w-7 flex-none text-right text-[10px] tabular-nums text-[var(--muted)]">
        {pct}
      </span>
    </div>
  );
}
