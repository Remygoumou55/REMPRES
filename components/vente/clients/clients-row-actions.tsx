"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Trash } from "lucide-react";
import type { Client } from "@/types/client";
import { deleteClientFromListAction } from "@/app/(app)/vente/clients/actions";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { useToast } from "@/components/providers/ToastProvider";
import { withViewModalQuery } from "@/lib/routing/modal-query";

type ClientsRowActionsProps = {
  client: Client;
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
  return qs ? `/vente/clients?${qs}` : "/vente/clients";
}

export function ClientsRowActions({
  client,
  name,
  canUpdate,
  canDelete,
  listQueryString,
}: ClientsRowActionsProps) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await deleteClientFromListAction(client.id);
      setConfirmOpen(false);
      if (result.success) {
        showSuccess("Le client a bien été supprimé.");
        pushThenRefresh(withListFlash(listQueryString, { success: "Le client a bien été supprimé." }));
      } else {
        showError(result.error);
        pushThenRefresh(withListFlash(listQueryString, { error: result.error }));
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-end gap-0.5">
        <Link
          href={withViewModalQuery(`/vente/clients/${client.id}`, client.id)}
          title="Voir"
          aria-label="Voir"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-darktext"
        >
          <Eye size={15} />
        </Link>
        {canUpdate ? (
          <EditActionLink
            href={`/vente/clients/${client.id}`}
            entityId={client.id}
            label="Modifier"
            iconOnly
          />
        ) : null}
        {canDelete ? (
          <button
            type="button"
            disabled={pending}
            title="Supprimer"
            aria-label={`Supprimer ${name}`}
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
        message={`Le client « ${name} » sera archivé (suppression logique). Cette action peut affecter l'historique des ventes liées. Continuer ?`}
        confirmLabel="Confirmer"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runDelete}
      />
    </>
  );
}
