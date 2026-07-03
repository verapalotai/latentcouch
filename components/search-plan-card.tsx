"use client";

import { useState } from "react";
import type { SearchPlan } from "@/lib/types";
import { isLocalizedKeyword } from "@/lib/shopping-taxonomy";
import { ActivityIndicator } from "./activity-indicator";

type SectionKey = "mustHave" | "niceToHave" | "avoid";

export function SearchPlanCard({
  plan,
  loading,
  onChange
}: {
  plan: SearchPlan | null;
  loading?: boolean;
  onChange?: (plan: SearchPlan) => void;
}) {
  const [editing, setEditing] = useState<SectionKey | null>(null);

  if (loading) {
    return (
      <div>
        <p className="text-lg font-semibold">Search plan</p>
        <div className="mt-4">
          <ActivityIndicator inline label="Building the search plan for the selected item..." />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-5 text-sm text-[var(--muted)]">
        Once you pick an object, latentcouch will create store-specific search queries and ranking cues.
      </div>
    );
  }

  function removeChip(section: SectionKey, value: string) {
    if (!plan || !onChange) return;
    onChange({ ...plan, [section]: plan[section].filter((item) => item !== value) });
  }

  const localized = Array.from(
    new Set([...plan.mustHave, ...plan.niceToHave, ...plan.avoid].filter(isLocalizedKeyword))
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">Search plan</p>
        <p className="rounded-full bg-white/70 px-3 py-1 text-xs text-[var(--muted)]">
          {plan.objectLabel}
        </p>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{plan.queryRationale}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Section
          title="Must have"
          tone="accent"
          items={plan.mustHave.filter((t) => !isLocalizedKeyword(t))}
          isEditing={editing === "mustHave"}
          onToggleEdit={() => setEditing((c) => (c === "mustHave" ? null : "mustHave"))}
          onRemove={(v) => removeChip("mustHave", v)}
        />
        <Section
          title="Nice to have"
          tone="neutral"
          items={plan.niceToHave.filter((t) => !isLocalizedKeyword(t))}
          isEditing={editing === "niceToHave"}
          onToggleEdit={() => setEditing((c) => (c === "niceToHave" ? null : "niceToHave"))}
          onRemove={(v) => removeChip("niceToHave", v)}
        />
        <Section
          title="Avoid"
          tone="muted"
          items={plan.avoid.filter((t) => !isLocalizedKeyword(t))}
          isEditing={editing === "avoid"}
          onToggleEdit={() => setEditing((c) => (c === "avoid" ? null : "avoid"))}
          onRemove={(v) => removeChip("avoid", v)}
        />
      </div>

      {localized.length ? (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/50 p-4">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Localized keywords
            </p>
            <InfoIcon tip="We search regional stores (Bonami, Möbelix, XXXLutz) in Hungarian, so English cues are translated to match their catalogs." />
          </div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {localized.map((kw) => (
              <li
                key={kw}
                lang="hu"
                className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-strong)]"
              >
                {kw}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  items,
  tone,
  isEditing,
  onToggleEdit,
  onRemove
}: {
  title: string;
  items: string[];
  tone: "accent" | "neutral" | "muted";
  isEditing: boolean;
  onToggleEdit: () => void;
  onRemove: (value: string) => void;
}) {
  const chipClass =
    tone === "accent"
      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      : tone === "muted"
        ? "bg-white/55 text-[var(--muted)] line-through decoration-[var(--muted)]/40"
        : "bg-white/75 text-[color:#4a3b31]";

  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/45 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {title}
        </p>
        <button
          aria-label={`Edit ${title}`}
          aria-pressed={isEditing}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
            isEditing ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:bg-black/5"
          }`}
          onClick={onToggleEdit}
          type="button"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17v3z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>

      {items.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${chipClass}`}
            >
              {item}
              {isEditing ? (
                <button
                  aria-label={`Remove ${item}`}
                  className="ml-0.5 opacity-70 hover:opacity-100"
                  onClick={() => onRemove(item)}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[var(--muted)]">None</p>
      )}
    </div>
  );
}

function InfoIcon({ tip }: { tip: string }) {
  return (
    <span
      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[var(--muted)]"
      tabIndex={0}
      title={tip}
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 11v5M12 8h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
      <span className="sr-only">{tip}</span>
    </span>
  );
}
