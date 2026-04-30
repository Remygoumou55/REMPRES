"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { markAsPaidAction } from "@/app/(app)/vente/nouvelle-vente/actions";
import { resolveErrorMessage } from "@/lib/messages";
import { formatGNF } from "@/lib/utils/formatCurrency";

type Props = { saleId: string; totalAmountGNF: number };

export function MarkAsPaidButton({ saleId, totalAmountGNF }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const ok = window.confirm(
      `Enregistrer le paiement complet pour un montant de ${formatGNF(totalAmountGNF)} ? Cette action mettra le statut sur « payé ».`,
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    const result = await markAsPaidAction(saleId, totalAmountGNF);
    setLoading(false);
    if (result.success) {
      setDone(true);
    } else {
      setError(resolveErrorMessage(result.error));
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
        className="inline-flex min-h-[2rem] items-center justify-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-green-700 hover:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            En cours…
          </>
        ) : (
          "Marquer payé"
        )}
      </button>
      {error && <p className="mt-1 max-w-[12rem] text-xs text-red-500">{error}</p>}
    </div>
  );
}
