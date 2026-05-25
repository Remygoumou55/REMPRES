"use client";

import { useState, useTransition } from "react";
import {
  postFinanceJournalBatchAction,
  rejectFinanceJournalBatchAction,
  submitFinanceJournalApprovalAction,
} from "@/modules/finance/server/actions/journal-actions";

export function FinanceJournalBatchActions({
  batchId,
  status,
}: {
  batchId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "draft") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await submitFinanceJournalApprovalAction({
              batchId,
              reason: "Soumission lot journal pour validation finance",
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setMessage("Demande d'approbation enregistree.");
          });
        }}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        Soumettre approbation
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await postFinanceJournalBatchAction(batchId);
            if (!result.success) {
              setError(result.error);
              return;
            }
            setMessage("Lot comptabilise.");
          });
        }}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        Comptabiliser
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await rejectFinanceJournalBatchAction({
              batchId,
              rejectionReason: "Rejet operationnel lot journal",
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setMessage("Demande rejetee.");
          });
        }}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Rejeter
      </button>
      {message ? <span className="text-xs text-green-700">{message}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
