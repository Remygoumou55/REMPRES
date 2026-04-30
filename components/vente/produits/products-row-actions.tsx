"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import { deleteProductFromListAction } from "@/app/(app)/vente/produits/actions";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await deleteProductFromListAction(product.id);
      setConfirmOpen(false);
      if (result.success) {
        router.push(withListFlash(listQueryString, { success: "Produit supprimé avec succès." }));
      } else {
        router.push(withListFlash(listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {/* Voir */}
        <Link
          href={`/vente/produits/${product.id}`}
          title="Voir le produit"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-darktext"
        >
          <Eye size={15} />
        </Link>

        {/* Modifier */}
        {canUpdate && (
          <EditActionLink
            href={`/vente/produits/${product.id}`}
            label="Modifier le produit"
            iconOnly
          />
        )}

        {/* Supprimer */}
        {canDelete && (
          <button
            type="button"
            disabled={pending}
            title={`Supprimer ${name}`}
            aria-label={`Supprimer ${name}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-danger transition hover:bg-danger/10 disabled:opacity-40"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size={15} />
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
