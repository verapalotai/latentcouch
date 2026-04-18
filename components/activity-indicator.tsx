type ActivityIndicatorProps = {
  label: string;
  inline?: boolean;
};

export function ActivityIndicator({ label, inline = false }: ActivityIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-3 ${
        inline
          ? "rounded-[1.25rem] border border-[var(--line)] bg-white/60 px-4 py-3"
          : "glass-panel rounded-[1.5rem] px-4 py-3"
      }`}
      aria-live="polite"
    >
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <span className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/25" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent)]" />
      </span>
      <span className="text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}
