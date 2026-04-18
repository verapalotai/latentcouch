type StoreStatus = {
  retailer: string;
  ok: boolean;
  error?: string;
  resultCount: number;
  manualSearchUrl?: string;
};

type StoreStatusListProps = {
  statuses: StoreStatus[];
  activeRetailer?: string | null;
  onFilterSelect?: (retailer: string) => void;
};

export function StoreStatusList({
  statuses,
  activeRetailer,
  onFilterSelect
}: StoreStatusListProps) {
  if (!statuses.length) {
    return null;
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status) => {
        const isFilterable = status.ok && status.resultCount > 0 && !status.manualSearchUrl;
        const isActive = activeRetailer === status.retailer;

        const tileClass = `rounded-[1.25rem] border p-3 text-sm transition ${
          isActive
            ? "border-[var(--accent)] bg-[rgba(173,95,58,0.09)] shadow-[0_8px_24px_rgba(173,95,58,0.12)]"
            : status.ok
              ? "border-[color:rgba(64,96,79,0.22)] bg-[rgba(64,96,79,0.06)]"
              : "border-[color:rgba(139,66,51,0.22)] bg-[rgba(139,66,51,0.06)]"
        } ${isFilterable ? "cursor-pointer hover:-translate-y-0.5 hover:bg-white/85" : ""}`;

        const content = (
          <>
            <p className="font-semibold capitalize">{status.retailer}</p>
            <p className="mt-1 text-[var(--muted)]">
              {status.ok ? `${status.resultCount} cards extracted` : status.error || "No results"}
            </p>
            {!status.ok && status.manualSearchUrl ? (
              <a
                className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]"
                href={status.manualSearchUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open store search
              </a>
            ) : null}
          </>
        );

        if (!isFilterable) {
          return (
            <div key={status.retailer} className={tileClass}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={status.retailer}
            className={`${tileClass} text-left`}
            onClick={() => onFilterSelect?.(status.retailer)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
