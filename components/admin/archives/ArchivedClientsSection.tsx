"use client";

import { useMemo, useState, useTransition, memo } from "react";
import Link from "next/link";
import { Users, RotateCcw } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { useToast } from "@/components/providers/ToastProvider";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { ConfirmActionDialog, ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { restoreClientAction } from "@/app/(app)/vente/clients/actions";
import {
  adminBulkRestoreArchivedClientsAction,
  adminPermanentDeleteArchivedClientsAction,
} from "@/app/(app)/admin/archives/actions";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { ArchiveSelectionBulkBar, PermanentDeleteArchivedRowButton, withAdminFlash } from "./ArchiveComponents";

export type AdminArchiveClientRow = {
  id: string;
  label: string;
  deletedAtLabel: string;
  deletedByLabel: string;
  searchIndex: string;
};

export const ArchivedClientsSection = memo(function ArchivedClientsSection({
  rows,
  totalCount,
}: {
  rows: AdminArchiveClientRow[];
  totalCount: number;
}) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();

  const { query, setQuery, filteredData } = useGlobalSearch({
    data: rows,
    searchFields: ["searchIndex"],
    delay: 200,
  });

  const visibleIds = useMemo(() => filteredData.map((r) => r.id), [filteredData]);
  const {
    selectedIds,
    selectedSet,
    selectedCount,
    allVisibleSelected,
    toggleOne,
    toggleAllVisible,
    clearSelection,
  } = useRowSelection(visibleIds);

  const [pending, startTransition] = useTransition();
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [confirmRestoreBulkOpen, setConfirmRestoreBulkOpen] = useState(false);

  function runBulkRestore() {
    startTransition(async () => {
      const result = await adminBulkRestoreArchivedClientsAction(selectedIds);
      setConfirmRestoreBulkOpen(false);
      clearSelection();
      if (result.success) {
        const msg = `${result.data.restored} client(s) restauré(s) avec succès.`;
        showSuccess(msg);
        pushThenRefresh(withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(withAdminFlash({ error: result.error }));
      }
    });
  }

  function runBulkPurge() {
    startTransition(async () => {
      const result = await adminPermanentDeleteArchivedClientsAction(selectedIds);
      setConfirmPurgeOpen(false);
      clearSelection();
      if (result.success) {
        const msg = result.data.deleted === 1 ? "1 client supprimé." : `${result.data.deleted} clients supprimés.`;
        showSuccess(msg);
        pushThenRefresh(withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(withAdminFlash({ error: result.error }));
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          <Users size={16} />
          Clients archivés ({totalCount})
        </h2>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Filtrer les clients..." className="max-w-xl" />

      <ArchiveSelectionBulkBar
        selectedCount={selectedCount}
        pluralLabel="clients"
        pending={pending}
        onClear={clearSelection}
        onOpenBulkRestore={() => setConfirmRestoreBulkOpen(true)}
        onOpenBulkPurge={() => setConfirmPurgeOpen(true)}
      />

      <ConfirmActionDialog
        open={confirmRestoreBulkOpen}
        title={`Restaurer ${selectedCount} client(s) ?`}
        message="Les clients sélectionnés redeviendront visibles."
        confirmLabel="Confirmer"
        loadingLabel="Restauration…"
        loading={pending}
        icon={<RotateCcw size={18} className="text-primary" />}
        onCancel={() => setConfirmRestoreBulkOpen(false)}
        onConfirm={runBulkRestore}
      />

      <ConfirmDangerDialog
        open={confirmPurgeOpen}
        title="Supprimer définitivement ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setConfirmPurgeOpen(false)}
        onConfirm={runBulkPurge}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="w-12 px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    disabled={filteredData.length === 0 || pending}
                    onChange={() => toggleAllVisible()}
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Client</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Supprimé</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Par</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">Aucun client trouvé.</td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedSet.has(row.id)} onChange={() => toggleOne(row.id)} />
                    </td>
                    <td className="px-4 py-2 font-medium">{row.label}</td>
                    <td className="px-4 py-2 text-gray-600">{row.deletedAtLabel}</td>
                    <td className="px-4 py-2 text-gray-500">{row.deletedByLabel}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <RestoreArchiveButton entityId={row.id} entityLabel={row.label} restoreAction={restoreClientAction} redirectPath="/admin/archives" />
                        <PermanentDeleteArchivedRowButton kind="client" id={row.id} label={row.label} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Link href="/vente/clients/archives" className="text-xs text-primary hover:underline">Page complète archives clients →</Link>
    </section>
  );
});
