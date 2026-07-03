"use client";

import { useEffect, useMemo } from "react";

type ImagePreviewListProps = {
  files: File[];
};

export function ImagePreviewList({ files }: ImagePreviewListProps) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  if (!files.length) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
      {previews.map((preview, index) => (
        <div key={preview} className="overflow-hidden rounded-[1.25rem] border border-[var(--line)]">
          <img alt={files[index]?.name || `Preview ${index + 1}`} className="h-32 w-full object-cover" src={preview} />
        </div>
      ))}
    </div>
  );
}
