"use client";

import { useState, useTransition } from "react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { markAsPaidAction } from "@/app/(app)/vente/nouvelle-vente/actions";
import { resolveErrorMessage, resolveUnknownErrorMessage } from "@/lib/messages";
import { formatGNF } from "@/lib/utils/formatCurrency";
import { ConfirmActionDialog } from "@/components/ui/confirm-danger-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/ToastProvider";

type Props = { saleId: string; totalAmountGNF: number };

export function MarkAsPaidButton({ saleId, totalAmountGNF }: Props) {
  const { refreshAfterMutation } = useAppMutationRefresh();
  const { showError } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runMarkPaid() {
    startTransition(async () => {
      try {
        setError(null);
        const result = await markAsPaidAction(saleId, totalAmountGNF);
        setConfirmOpen(false);
        if (result.success) {
          setDone(true);
          refreshAfterMutation();
        } else {
          setError(resolveErrorMessage(result.error));
        }
      } catch (error) {
        const message = resolveUnknownErrorMessage(error);
        setError(message);
        showError(message);
      }
    });
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
      <Button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending || confirmOpen}
        size="sm"
        className="min-h-[2rem] bg-green-600 text-white hover:bg-green-700"
        loading={pending}
        loadingText="En cours..."
      >
        Marquer paye
      </Button>
      {error && <p className="mt-1 max-w-[12rem] text-xs text-red-500">{error}</p>}

      <ConfirmActionDialog
        open={confirmOpen}
        title="Enregistrer le paiement complet ?"
        message={`Le statut passera à « payé » pour un montant de ${formatGNF(totalAmountGNF)}. Cette opération est tracée.`}
        confirmLabel="Confirmer le paiement"
        loadingLabel="Enregistrement…"
        loading={pending}
        subtitle="Validation comptable"
        onCancel={() => !pending && setConfirmOpen(false)}
        onConfirm={runMarkPaid}
      />
    </div>
  );
}
