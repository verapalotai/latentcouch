import type { Inspiration } from "@/lib/types";
import { ActivityIndicator } from "./activity-indicator";

export function InspirationSummary({
  inspiration,
  loading
}: {
  inspiration: Inspiration | null;
  loading?: boolean;
}) {
  return (
    <section>
      <p className="text-lg font-semibold">Inspiration read</p>

      {loading ? (
        <div className="mt-4">
          <ActivityIndicator inline label="Reading the inspiration style cues..." />
        </div>
      ) : !inspiration ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Upload inspiration images to extract the palette, materials, and styling cues we should shop against.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Cue label="Styles" items={inspiration.styleKeywords} />
          <Cue label="Palette" items={inspiration.colorPalette} swatches />
          <Cue label="Materials" items={inspiration.materials} />
          <Cue label="Shapes" items={inspiration.shapeKeywords} />
          <Cue label="Avoid" items={inspiration.avoidKeywords} muted />
        </div>
      )}
    </section>
  );
}

function Cue({
  label,
  items,
  swatches = false,
  muted = false
}: {
  label: string;
  items: string[];
  swatches?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      {items.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                muted
                  ? "bg-white/50 text-[var(--muted)] line-through decoration-[var(--muted)]/40"
                  : "bg-white/75 text-[color:#4a3b31]"
              }`}
            >
              {swatches ? (
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: cssColor(item) }}
                />
              ) : null}
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">None</p>
      )}
    </div>
  );
}

// Best-effort colour swatch from a free-text palette label (e.g. "warm oak", "soft gray").
function cssColor(label: string): string {
  const key = label.toLowerCase();
  const table: Array<[string, string]> = [
    ["cream", "#f4ead6"],
    ["oat", "#e7dcc5"],
    ["white", "#f7f5f0"],
    ["oak", "#c8a97e"],
    ["wood", "#c8a97e"],
    ["terracotta", "#c96b4a"],
    ["brass", "#b08d57"],
    ["black", "#2b2b2b"],
    ["charcoal", "#3a3a3a"],
    ["grey", "#9a9a9a"],
    ["gray", "#9a9a9a"],
    ["beige", "#e3d5be"],
    ["green", "#7c9070"],
    ["blue", "#7d94ac"],
    ["sand", "#dcc7a3"]
  ];
  const hit = table.find(([name]) => key.includes(name));
  return hit ? hit[1] : "#d8cbb8";
}
