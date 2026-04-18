import type { SearchPlan } from "@/lib/types";
import { ActivityIndicator } from "./activity-indicator";

export function SearchPlanCard({ plan, loading }: { plan: SearchPlan | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="glass-panel rounded-[2rem] p-5">
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

  return (
    <div className="glass-panel rounded-[2rem] p-5">
      <p className="text-lg font-semibold">Search plan</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{plan.queryRationale}</p>

      <div className="mt-4 space-y-3 text-sm">
        <PlanRow label="Object" value={plan.objectLabel} />
        <PlanRow label="Must have" value={plan.mustHave.join(", ")} />
        <PlanRow label="Nice to have" value={plan.niceToHave.join(", ")} />
        <PlanRow label="Avoid" value={plan.avoid.join(", ")} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {plan.retailerQueries.map((retailerQuery) => (
          <span key={retailerQuery.retailer} className="rounded-full bg-white/75 px-3 py-1 text-xs">
            {retailerQuery.retailer}: {retailerQuery.query}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
