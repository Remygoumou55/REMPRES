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
import { applyListMutationFeedback } from "@/lib/governance/approvals/client-mutation-feedback";

type ProductsRowActionsProps = {
  product: Product;
  name: string;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
};

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
      applyListMutationFeedback(result, {
        pathname: "/vente/produits",
        queryString: listQueryString,
        successMessage: "Le produit a bien été supprimé.",
        pushThenRefresh,
        showSuccess,
        showError,
      });
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
