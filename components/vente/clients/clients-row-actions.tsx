"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import type { Client } from "@/types/client";
import { deleteClientFromListAction } from "@/app/(app)/vente/clients/actions";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await deleteClientFromListAction(client.id);
      setConfirmOpen(false);
      if (result.success) {
        router.push(withListFlash(listQueryString, { success: "Client supprimé avec succès." }));
      } else {
        router.push(withListFlash(listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/vente/clients/${client.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-darktext"
        >
          <Eye size={13} />
          <span className="hidden sm:inline">Voir</span>
        </Link>
        {canUpdate ? (
          <EditActionLink href={`/vente/clients/${client.id}`} />
        ) : null}
        {canDelete ? (
          <button
            type="button"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Supprimer ${name}`}
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Supprimer</span>
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
