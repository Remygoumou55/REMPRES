"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Trash } from "lucide-react";
import { archiveAndDeleteSaleAction } from "@/app/(app)/vente/historique/actions";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { MarkAsPaidButton } from "@/components/vente/historique/mark-as-paid-button";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { withViewModalQuery } from "@/lib/routing/modal-query";

export type SaleRowForActions = {
  id: string;
  total_amount_gnf: number;
  payment_status: string;
};

type SalesRowActionsProps = {
  sale: SaleRowForActions;
  labelReference: string;
  canDelete: boolean;
  listQueryString: string;
  showMarkPaid: boolean;
};

function withListFlash(queryString: string, flash: { success?: string; error?: string }): string {
  const p = new URLSearchParams(queryString);
  p.delete("success");
  p.delete("error");
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `/vente/historique?${qs}` : "/vente/historique";
}

export function SalesRowActions({
  sale,
  labelReference,
  canDelete,
  listQueryString,
  showMarkPaid,
}: SalesRowActionsProps) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await archiveAndDeleteSaleAction(sale.id);
      setConfirmOpen(false);
      if (result.success) {
        pushThenRefresh(
          withListFlash(listQueryString, { success: "Vente archivée et retirée de l'historique." }),
        );
      } else {
        pushThenRefresh(withListFlash(listQueryString, { error: result.error }));
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-0.5">
        <Link
          href={withViewModalQuery(`/vente/historique/${sale.id}`, sale.id)}
          title="Voir"
          aria-label="Voir le détail de la vente"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-darktext"
        >
          <Eye size={15} />
        </Link>
        {showMarkPaid ? (
          <MarkAsPaidButton saleId={sale.id} totalAmountGNF={sale.total_amount_gnf} />
        ) : null}
        {canDelete ? (
          <button
            type="button"
            disabled={pending}
            title="Supprimer"
            aria-label={`Supprimer la vente ${labelReference}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-danger transition hover:bg-danger/10 disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash size={15} />
          </button>
        ) : null}
      </div>

      <ConfirmDangerDialog
        open={confirmOpen}
        title="Confirmer la suppression"
        message={`La vente « ${labelReference} » sera copiée dans les archives (données figées), puis retirée de l'historique (suppression logique). Continuer ?`}
        confirmLabel="Confirmer"
        loadingLabel="Traitement…"
        loading={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runDelete}
      />
    </>
  );
}
