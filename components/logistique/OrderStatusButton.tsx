"use client";

import { memo, useState, useTransition } from "react";
import { cancelOrderAction, confirmOrderAction, receiveOrderAction } from "@/app/(app)/logistique/commandes/actions";
import { ConfirmActionDialog } from "@/components/ui/confirm-danger-dialog";
import { PO_STATUS_TRANSITIONS } from "@/lib/logistique/purchase-order-shared";

type Props = {
  orderId: string;
  currentStatus: string;
  orderNumber: string;
};

function OrderStatusButtonInner({ orderId, currentStatus, orderNumber }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [openReceiveConfirm, setOpenReceiveConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const transitions = PO_STATUS_TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return null;

  function runAction(action: "confirmed" | "received" | "cancelled") {
    setError(null);
    startTransition(async () => {
      const result =
        action === "confirmed"
          ? await confirmOrderAction(orderId)
          : action === "received"
            ? await receiveOrderAction(orderId)
            : await cancelOrderAction(orderId);
      if (!result.success) {
        setError(result.error ?? "Action impossible.");
      } else {
        setOpenReceiveConfirm(false);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {transitions.includes("confirmed") ? (
          <button
            type="button"
            className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            onClick={() => runAction("confirmed")}
            disabled={isPending}
          >
            ✓ Confirmer
          </button>
        ) : null}

        {transitions.includes("received") ? (
          <button
            type="button"
            className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            onClick={() => setOpenReceiveConfirm(true)}
            disabled={isPending}
          >
            📦 Marquer reçue
          </button>
        ) : null}

        {transitions.includes("cancelled") ? (
          <button
            type="button"
            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            onClick={() => runAction("cancelled")}
            disabled={isPending}
          >
            ✗ Annuler
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      <ConfirmActionDialog
        open={openReceiveConfirm}
        onCancel={() => setOpenReceiveConfirm(false)}
        onConfirm={() => runAction("received")}
        loading={isPending}
        title="Confirmer la réception"
        message={`Confirmer la réception de la commande ${orderNumber} ? Le stock sera mis à jour automatiquement. Cette action est irréversible.`}
        confirmLabel="✓ Confirmer"
        cancelLabel="✗ Annuler"
      />
    </>
  );
}

export const OrderStatusButton = memo(OrderStatusButtonInner);
