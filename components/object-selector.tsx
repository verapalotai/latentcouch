"use client";

import type { DetectedObject } from "@/lib/types";

type ObjectSelectorProps = {
  objects: DetectedObject[];
  selectedId?: string;
  onSelect: (object: DetectedObject) => void;
};

export function ObjectSelector({ objects, selectedId, onSelect }: ObjectSelectorProps) {
  if (!objects.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-4 text-sm text-[var(--muted)]">
        Analyze room photos to see detected furniture pieces.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {objects.map((object) => {
        const selected = object.id === selectedId;

        return (
          <button
            key={object.id}
            className={`rounded-[1.5rem] border p-4 text-left transition ${
              selected
                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                : "border-[var(--line)] bg-white/65 hover:bg-white"
            }`}
            onClick={() => onSelect(object)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold capitalize">{object.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{object.attributes.sizeHint}</p>
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs">
                {Math.round(object.confidence * 100)}%
              </span>
            </div>

            <p className="mt-3 text-sm text-[var(--muted)]">
              {[...object.attributes.colors, ...object.attributes.materials, ...object.attributes.shapes]
                .filter(Boolean)
                .slice(0, 5)
                .join(" • ")}
            </p>
          </button>
        );
      })}
    </div>
  );
}
