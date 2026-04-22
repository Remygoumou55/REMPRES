"use client";

import { useState } from "react";
import { markAsPaidAction } from "@/app/vente/nouvelle-vente/actions";

type Props = { saleId: string; totalAmountGNF: number };

export function MarkAsPaidButton({ saleId, totalAmountGNF }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await markAsPaidAction(saleId, totalAmountGNF);
    setLoading(false);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        ✓ Payé
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "…" : "Marquer payé"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
