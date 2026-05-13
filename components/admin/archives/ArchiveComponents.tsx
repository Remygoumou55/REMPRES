"use client";

import { memo, useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import {
  adminPermanentDeleteArchivedClientsAction,
  adminPermanentDeleteArchivedProductsAction,
} from "@/app/(app)/admin/archives/actions";

export function withAdminFlash(flash: { success?: string; error?: string }): string {
  const p = new URLSearchParams();
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `/admin/archives?${qs}` : "/admin/archives";
}

export const ArchiveSelectionBulkBar = memo(function ArchiveSelectionBulkBar(props: {
  selectedCount: number;
  pluralLabel: string;
  pending: boolean;
  onClear: () => void;
  onOpenBulkRestore: () => void;
  onOpenBulkPurge: () => void;
}) {
  const { selectedCount, pluralLabel, pending, onClear, onOpenBulkRestore, onOpenBulkPurge } = props;
  if (selectedCount <= 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Actions sur les archives sélectionnées"
      aria-busy={pending}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2"
    >
      <p className="text-xs font-semibold text-darktext sm:min-w-0 sm:flex-1">
        {selectedCount} {pluralLabel} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end sm:gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={pending}
          className="min-h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-darktext disabled:opacity-50 sm:w-auto"
        >
          Annuler la sélection
        </button>
        <button
          type="button"
          onClick={onOpenBulkRestore}
          disabled={pending}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-primary bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50 sm:w-auto"
        >
          <RotateCcw size={14} />
          Restaurer la sélection
        </button>
        <button
          type="button"
          onClick={onOpenBulkPurge}
          disabled={pending}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md bg-danger px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          <Trash2 size={14} />
          Supprimer définitivement
        </button>
      </div>
    </div>
  );
});

export const PermanentDeleteArchivedRowButton = memo(function PermanentDeleteArchivedRowButton(props: {
  kind: "client" | "product";
  id: string;
  label: string;
}) {
  const { kind, id, label } = props;
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const message =
    kind === "client"
      ? `« ${label} » sera effacé de la base de données. Les ventes existantes perdront le lien vers ce client. Action irréversible.`
      : `« ${label} » sera effacé définitivement ; l’historique des mouvements de stock pour ce produit sera supprimé. Action irréversible.`;

  function run() {
    startTransition(async () => {
      const result =
        kind === "client"
          ? await adminPermanentDeleteArchivedClientsAction([id])
          : await adminPermanentDeleteArchivedProductsAction([id]);
      setOpen(false);
      if (result.success) {
        showSuccess(kind === "client" ? "Client supprimé définitivement." : "Produit supprimé définitivement.");
        pushThenRefresh(withAdminFlash({ success: `« ${label} » a été définitivement supprimé.` }));
      } else {
        showError(result.error);
        pushThenRefresh(withAdminFlash({ error: result.error }));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
      >
        <Trash2 size={13} />
        Supprimer
      </button>
      <ConfirmDangerDialog
        open={open}
        title="Supprimer définitivement ?"
        message={message}
        confirmLabel="Supprimer définitivement"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={run}
      />
    </>
  );
});
