"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveLogisticsPurchaseOrderAction,
  submitLogisticsPurchaseOrderAction,
} from "@/modules/logistics/server/actions/logistics-actions";

export function LogisticsPurchaseOrderRowActions({
  purchaseOrderId,
  status,
}: {
  purchaseOrderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status === "closed" || status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-1">
      {status === "draft" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await submitLogisticsPurchaseOrderAction(purchaseOrderId);
              router.refresh();
            })
          }
          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          Soumettre
        </button>
      ) : null}
      {status === "submitted" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await approveLogisticsPurchaseOrderAction(purchaseOrderId);
              router.refresh();
            })
          }
          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        >
          Approuver
        </button>
      ) : null}
    </div>
  );
}
