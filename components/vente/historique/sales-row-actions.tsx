"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { archiveAndDeleteSaleAction } from "@/app/(app)/vente/historique/actions";
import { MarkAsPaidButton } from "@/components/vente/historique/mark-as-paid-button";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await archiveAndDeleteSaleAction(sale.id);
      setConfirmOpen(false);
      if (result.success) {
        router.push(
          withListFlash(listQueryString, { success: "Vente archivée et retirée de l'historique." }),
        );
      } else {
        router.push(withListFlash(listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Link
          href={`/vente/historique/${sale.id}`}
          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
        >
          Détails
        </Link>
        {showMarkPaid ? (
          <MarkAsPaidButton saleId={sale.id} totalAmountGNF={sale.total_amount_gnf} />
        ) : null}
        {canDelete ? (
          <button
            type="button"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Supprimer la vente ${labelReference}`}
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Supprimer</span>
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
