"use client";

import { clsx } from "clsx";

type UploadZoneProps = {
  label: string;
  hint: string;
  files: File[];
  onChange: (files: File[]) => void;
};

export function UploadZone({ label, hint, files, onChange }: UploadZoneProps) {
  return (
    <label className="glass-panel block cursor-pointer rounded-[2rem] p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{label}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold",
            files.length
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "bg-white/70 text-[var(--muted)]"
          )}
        >
          {files.length ? `${files.length} selected` : "No files"}
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/60 px-4 py-7 text-center">
        <p className="text-sm">Drop photos here or browse from your device.</p>
        <p className="mt-1 text-xs text-[var(--muted)]">PNG, JPG, WEBP, GIF</p>
        <span className="mt-4 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
          Browse files
        </span>
      </div>

      {files.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.slice(0, 3).map((file) => (
            <span key={`${file.name}-${file.lastModified}`} className="rounded-full bg-white/75 px-3 py-1 text-xs text-[var(--muted)]">
              {file.name}
            </span>
          ))}
          {files.length > 3 ? (
            <span className="rounded-full bg-white/75 px-3 py-1 text-xs text-[var(--muted)]">
              +{files.length - 3} more
            </span>
          ) : null}
        </div>
      ) : null}

      <input
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => onChange(Array.from(event.target.files || []))}
      />
    </label>
  );
}
