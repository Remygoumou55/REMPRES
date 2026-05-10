"use client";

export type CashflowMiniPoint = { date: string; closing: number };

export function FinanceCashflowMiniChart({ points }: { points: CashflowMiniPoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-gray-500">Aucune donnée de clôture sur la période.</p>;
  }

  const max = Math.max(...points.map((p) => Math.abs(Number(p.closing))), 1);

  return (
    <div className="flex h-44 items-end gap-1 border-b border-gray-100 pb-1">
      {points.map((p) => {
        const h = Math.min(100, (Math.abs(Number(p.closing)) / max) * 100);
        return (
          <div key={p.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-[14px] rounded-t bg-primary/85 transition-[height]"
              style={{ height: `${Math.max(4, h)}%` }}
              title={`${p.date}: ${Number(p.closing).toLocaleString("fr-FR")} GNF`}
            />
            <span className="max-w-full truncate text-[10px] text-gray-400">{p.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
