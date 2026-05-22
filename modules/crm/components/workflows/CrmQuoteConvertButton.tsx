"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertCrmQuoteToSaleAction } from "@/modules/crm/server/actions/crm-actions";

type CrmQuoteConvertButtonProps = {
  quoteId: string;
  status: string;
  saleId: string | null;
};

export function CrmQuoteConvertButton({ quoteId, status, saleId }: CrmQuoteConvertButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (saleId || status === "converted") {
    return null;
  }

  if (status !== "accepted") {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-50"
        onClick={() => {
          if (!window.confirm("Convertir ce devis accepté en vente (stock + liaison FK) ?")) return;
          setError(null);
          startTransition(async () => {
            const res = await convertCrmQuoteToSaleAction(quoteId, "cash");
            if (!res.success) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Conversion…" : "→ Vente"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
