"use client";

import { memo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export const DeltaText = memo(function DeltaText({
  pct,
  kind,
}: {
  pct: number | null;
  kind: "revenue" | "expenses" | "profit";
}) {
  if (pct == null || Number.isNaN(pct)) {
    return <span className="text-gray-400">n/a</span>;
  }
  const good =
    kind === "revenue" || kind === "profit"
      ? pct >= 0
      : kind === "expenses"
        ? pct <= 0
        : true;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${good ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}% vs période préc.
    </span>
  );
});

export const FinanceKpiCard = memo(function FinanceKpiCard({
  title,
  value,
  sub,
  accent,
  titleHint,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  accent: "neutral" | "green" | "red" | "blue" | "amber";
  titleHint?: string;
}) {
  const ring: Record<typeof accent, string> = {
    green: "border-emerald-100 bg-emerald-50/40",
    red: "border-rose-100 bg-rose-50/40",
    blue: "border-sky-100 bg-sky-50/40",
    amber: "border-amber-100 bg-amber-50/40",
    neutral: "border-gray-100 bg-white",
  };
  return (
    <div
      className={`rounded-2xl border px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md ${ring[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500" title={titleHint}>
        {title}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-darktext">{value}</p>
      {sub && <div className="mt-2 text-sm">{sub}</div>}
    </div>
  );
});
