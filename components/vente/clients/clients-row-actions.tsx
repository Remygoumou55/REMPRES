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
import { applyListMutationFeedback } from "@/lib/governance/approvals/client-mutation-feedback";

type ClientsRowActionsProps = {
  client: Client;
  name: string;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
};

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
      applyListMutationFeedback(result, {
        pathname: "/vente/clients",
        queryString: listQueryString,
        successMessage: "Le client a bien été supprimé.",
        pushThenRefresh,
        showSuccess,
        showError,
      });
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
