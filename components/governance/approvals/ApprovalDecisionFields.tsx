"use client";

import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";

type Props = {
  requestId: string;
};

/**
 * Champs + actions pour une décision d’approbation, avec état de chargement (useFormStatus).
 * Doit rester enfant direct du <form action={…}> serveur.
 */
export function ApprovalDecisionFields({ requestId }: Props) {
  const { pending } = useFormStatus();

  return (
    <div className="flex w-full flex-col gap-3 border-t border-gray-100 pt-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Motif du rejet (facultatif)</span>
        <input
          type="text"
          name="reason"
          disabled={pending}
          autoComplete="off"
          placeholder="Ex. données incomplètes, hors périmètre…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-darktext outline-none transition focus:border-primary focus:bg-white disabled:opacity-60"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:flex-none sm:min-w-[140px]"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Approuver
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100 disabled:opacity-60 sm:flex-none sm:min-w-[140px]"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Rejeter
        </button>
      </div>
    </div>
  );
}
