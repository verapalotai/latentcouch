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

        const variant = isActive
          ? "border-transparent bg-[var(--accent)] text-white shadow-[0_10px_28px_rgba(187,108,63,0.30)]"
          : status.ok
            ? "border-[var(--line)] bg-white/70"
            : "border-[var(--line)] bg-white/35";

        const tileClass = `rounded-[1.25rem] border p-3 text-sm transition ${variant} ${
          isFilterable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : ""
        }`;

        const content = (
          <>
            <p className="font-semibold capitalize">{status.retailer}</p>
            {status.ok ? (
              <p className={`mt-1 ${isActive ? "text-white/85" : "text-[var(--muted)]"}`}>
                {status.resultCount} cards extracted
              </p>
            ) : status.manualSearchUrl ? (
              <a
                className="mt-2 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-white"
                href={status.manualSearchUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open store search
              </a>
            ) : (
              <p className="mt-1 text-[var(--muted)]">No results</p>
            )}
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
