type StatusBannerProps = {
  tone: "neutral" | "success" | "error";
  children: React.ReactNode;
};

export function StatusBanner({ tone, children }: StatusBannerProps) {
  const styles =
    tone === "success"
      ? "border-[color:rgba(64,96,79,0.22)] bg-[rgba(64,96,79,0.08)] text-[var(--success)]"
      : tone === "error"
        ? "border-[color:rgba(139,66,51,0.22)] bg-[rgba(139,66,51,0.08)] text-[var(--danger)]"
        : "border-[var(--line)] bg-white/60 text-[var(--foreground)]";

  return <div className={`rounded-[1.25rem] border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
