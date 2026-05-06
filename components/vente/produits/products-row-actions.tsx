"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Trash } from "lucide-react";
import type { Product } from "@/types/product";
import { deleteProductFromListAction } from "@/app/(app)/vente/produits/actions";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { useToast } from "@/components/providers/ToastProvider";
import { withViewModalQuery } from "@/lib/routing/modal-query";

type ProductsRowActionsProps = {
  product: Product;
  name: string;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
};

function withListFlash(queryString: string, flash: { success?: string; error?: string }): string {
  const p = new URLSearchParams(queryString);
  p.delete("success");
  p.delete("error");
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `/vente/produits?${qs}` : "/vente/produits";
}

export function ProductsRowActions({
  product,
  name,
  canUpdate,
  canDelete,
  listQueryString,
}: ProductsRowActionsProps) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await deleteProductFromListAction(product.id);
      setConfirmOpen(false);
      if (result.success) {
        showSuccess("Le produit a bien été supprimé.");
        pushThenRefresh(withListFlash(listQueryString, { success: "Le produit a bien été supprimé." }));
      } else {
        showError(result.error);
        pushThenRefresh(withListFlash(listQueryString, { error: result.error }));
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-center gap-0.5">
        <Link
          href={withViewModalQuery(`/vente/produits/${product.id}`, product.id)}
          title="Voir"
          aria-label="Voir"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-darktext"
        >
          <Eye size={15} />
        </Link>

        {canUpdate && (
          <EditActionLink
            href={`/vente/produits/${product.id}`}
            entityId={product.id}
            label="Modifier"
            iconOnly
          />
        )}

        {canDelete && (
          <button
            type="button"
            disabled={pending}
            title="Supprimer"
            aria-label={`Supprimer ${name}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-danger transition hover:bg-danger/10 disabled:opacity-40"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash size={15} />
          </button>
        )}
      </div>

      <ConfirmDangerDialog
        open={confirmOpen}
        title="Confirmer la suppression"
        message={`Le produit « ${name} » sera archivé (suppression logique). Les lignes de vente existantes peuvent toujours y faire référence. Continuer ?`}
        confirmLabel="Confirmer"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runDelete}
      />
    </>
  );
}
