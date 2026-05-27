"use client";

import { memo } from "react";

export const RealtimeLiveBadge = memo(function RealtimeLiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
        aria-hidden
      />
      En direct
    </span>
  );
});
