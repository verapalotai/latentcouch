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
    <section className="glass-panel rounded-[2rem] p-5">
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
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Styles" value={inspiration.styleKeywords.join(", ")} />
          <Row label="Palette" value={inspiration.colorPalette.join(", ")} />
          <Row label="Materials" value={inspiration.materials.join(", ")} />
          <Row label="Shapes" value={inspiration.shapeKeywords.join(", ")} />
          <Row label="Avoid" value={inspiration.avoidKeywords.join(", ")} />
          <p className="rounded-[1.25rem] bg-white/70 p-3 text-[var(--muted)]">{inspiration.shoppingSummary}</p>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1">{value || "None"}</p>
    </div>
  );
}
