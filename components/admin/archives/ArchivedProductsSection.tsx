"use client";

import { useMemo, useState, useTransition, memo } from "react";
import Link from "next/link";
import { Package, RotateCcw } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { useToast } from "@/components/providers/ToastProvider";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { ConfirmActionDialog, ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { restoreProductAction } from "@/app/(app)/vente/produits/actions";
import {
  adminBulkRestoreArchivedProductsAction,
  adminPermanentDeleteArchivedProductsAction,
} from "@/app/(app)/admin/archives/actions";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { GLOBAL_LIST_SEARCH_DEBOUNCE_MS } from "@/lib/data-listing";
import { ArchiveSelectionBulkBar, PermanentDeleteArchivedRowButton, withAdminFlash } from "./ArchiveComponents";
import { TableShell } from "@/components/ui/table-shell";

export type AdminArchiveProductRow = {
  id: string;
  name: string;
  sku: string;
  deletedAtLabel: string;
  deletedByLabel: string;
  searchIndex: string;
};

export const ArchivedProductsSection = memo(function ArchivedProductsSection({
  rows,
  totalCount,
}: {
  rows: AdminArchiveProductRow[];
  totalCount: number;
}) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();

  const { query, setQuery, filteredData } = useGlobalSearch({
    data: rows,
    searchFields: ["searchIndex"],
    delay: GLOBAL_LIST_SEARCH_DEBOUNCE_MS,
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
      const result = await adminBulkRestoreArchivedProductsAction(selectedIds);
      setConfirmRestoreBulkOpen(false);
      clearSelection();
      if (result.success) {
        const msg = `${result.data.restored} produit(s) restauré(s) avec succès.`;
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
      const result = await adminPermanentDeleteArchivedProductsAction(selectedIds);
      setConfirmPurgeOpen(false);
      clearSelection();
      if (result.success) {
        const msg = result.data.deleted === 1 ? "1 produit supprimé." : `${result.data.deleted} produits supprimés.`;
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
          <Package size={16} />
          Produits archivés ({totalCount})
        </h2>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Filtrer les produits..." className="max-w-xl" />

      <ArchiveSelectionBulkBar
        selectedCount={selectedCount}
        pluralLabel="produits"
        pending={pending}
        onClear={clearSelection}
        onOpenBulkRestore={() => setConfirmRestoreBulkOpen(true)}
        onOpenBulkPurge={() => setConfirmPurgeOpen(true)}
      />

      <ConfirmActionDialog
        open={confirmRestoreBulkOpen}
        title={`Restaurer ${selectedCount} produit(s) ?`}
        message="Les produits sélectionnés redeviendront visibles."
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

      <TableShell>
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
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Produit</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Supprimé</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Par</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">Aucun produit trouvé.</td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedSet.has(row.id)} onChange={() => toggleOne(row.id)} />
                    </td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{row.sku}</td>
                    <td className="px-4 py-2 text-gray-600">{row.deletedAtLabel}</td>
                    <td className="px-4 py-2 text-gray-500">{row.deletedByLabel}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <RestoreArchiveButton entityId={row.id} entityLabel={row.name} restoreAction={restoreProductAction} redirectPath="/admin/archives" />
                        <PermanentDeleteArchivedRowButton kind="product" id={row.id} label={row.name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </TableShell>
      <Link href="/vente/produits/archives" className="text-xs text-primary hover:underline">Page complète archives produits →</Link>
    </section>
  );
});
