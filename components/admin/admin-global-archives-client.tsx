"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, RotateCcw, Search, Trash2, Users } from "lucide-react";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { useToast } from "@/components/providers/ToastProvider";
import { restoreClientAction } from "@/app/(app)/vente/clients/actions";
import { restoreProductAction } from "@/app/(app)/vente/produits/actions";
import {
  adminBulkRestoreArchivedClientsAction,
  adminBulkRestoreArchivedProductsAction,
  adminPermanentDeleteArchivedClientsAction,
  adminPermanentDeleteArchivedProductsAction,
} from "@/app/(app)/admin/archives/actions";
import { pushThenRefresh } from "@/lib/navigation/push-then-refresh";

export type AdminArchiveClientRow = {
  id: string;
  label: string;
  deletedAtLabel: string;
  deletedByLabel: string;
  /** Chaîne normalisée (minuscules) pour filtrage instantané côté client */
  searchIndex: string;
};

export type AdminArchiveProductRow = {
  id: string;
  name: string;
  sku: string;
  deletedAtLabel: string;
  deletedByLabel: string;
  searchIndex: string;
};

const SEARCH_DEBOUNCE_MS = 180;

function withAdminFlash(flash: { success?: string; error?: string }): string {
  const p = new URLSearchParams();
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `/admin/archives?${qs}` : "/admin/archives";
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function ArchiveSelectionBulkBar(props: {
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
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
      <p className="text-xs font-semibold text-darktext">
        {selectedCount} {pluralLabel} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={pending}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-darktext disabled:opacity-50"
        >
          Annuler la sélection
        </button>
        <button
          type="button"
          onClick={onOpenBulkRestore}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Restaurer la sélection
        </button>
        <button
          type="button"
          onClick={onOpenBulkPurge}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Trash2 size={14} />
          Supprimer définitivement
        </button>
      </div>
    </div>
  );
}

function PermanentDeleteArchivedRowButton(props: {
  kind: "client" | "product";
  id: string;
  label: string;
}) {
  const { kind, id, label } = props;
  const router = useRouter();
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
        pushThenRefresh(router, withAdminFlash({ success: `« ${label} » a été définitivement supprimé.` }));
      } else {
        showError(result.error);
        pushThenRefresh(router, withAdminFlash({ error: result.error }));
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
        aria-label={`Supprimer définitivement ${label}`}
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
}

function ArchivedClientsSection({
  rows,
  totalCount,
}: {
  rows: AdminArchiveClientRow[];
  totalCount: number;
}) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.searchIndex.includes(q));
  }, [rows, debouncedSearch]);

  const visibleIds = filteredRows.map((r) => r.id);
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
        pushThenRefresh(router, withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(router, withAdminFlash({ error: result.error }));
      }
    });
  }

  function runBulkPurge() {
    startTransition(async () => {
      const result = await adminPermanentDeleteArchivedClientsAction(selectedIds);
      setConfirmPurgeOpen(false);
      clearSelection();
      if (result.success) {
        const msg =
          result.data.deleted === 1
            ? "1 client définitivement supprimé."
            : `${result.data.deleted} clients définitivement supprimés.`;
        showSuccess(msg);
        pushThenRefresh(router, withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(router, withAdminFlash({ error: result.error }));
      }
    });
  }

  const searching = debouncedSearch.trim().length > 0;
  const disableHeaderCheckbox = filteredRows.length === 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          <Users size={16} />
          Clients archivés ({totalCount}
          {searching ? ` — ${filteredRows.length} affiché${filteredRows.length > 1 ? "s" : ""}` : ""})
        </h2>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filtrer les clients (nom, e-mail, téléphone, ville…)"
        className="max-w-xl"
      />

      <ArchiveSelectionBulkBar
        selectedCount={selectedCount}
        pluralLabel="clients"
        pending={pending}
        onClear={clearSelection}
        onOpenBulkRestore={() => setConfirmRestoreBulkOpen(true)}
        onOpenBulkPurge={() => setConfirmPurgeOpen(true)}
      />

      <Modal
        open={confirmRestoreBulkOpen}
        onClose={() => {
          if (!pending) setConfirmRestoreBulkOpen(false);
        }}
        title={`Restaurer ${selectedCount} client${selectedCount > 1 ? "s" : ""} ?`}
        size="md"
      >
        <p className="text-sm text-darktext/80">
          Les clients sélectionnés redeviendront visibles dans les listes actives.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
            onClick={() => setConfirmRestoreBulkOpen(false)}
            disabled={pending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={runBulkRestore}
            disabled={pending}
          >
            {pending ? "Restauration…" : "Confirmer"}
          </button>
        </div>
      </Modal>

      <ConfirmDangerDialog
        open={confirmPurgeOpen}
        title="Supprimer définitivement la sélection ?"
        message={`${selectedCount} client(s) seront effacés de la base de données. Cette action est irréversible.`}
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
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={allVisibleSelected}
                    disabled={disableHeaderCheckbox || pending}
                    onChange={() => toggleAllVisible()}
                    aria-label="Sélectionner tous les clients affichés"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Client</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Supprimé</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Par</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Aucun client archivé.
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Aucun client ne correspond à cette recherche.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedSet.has(row.id)}
                        disabled={pending}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Sélectionner ${row.label}`}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{row.label}</td>
                    <td className="px-4 py-2 text-gray-600">{row.deletedAtLabel}</td>
                    <td className="px-4 py-2 text-gray-500">{row.deletedByLabel}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <RestoreArchiveButton
                          entityId={row.id}
                          entityLabel={row.label}
                          restoreAction={restoreClientAction}
                          redirectPath="/admin/archives"
                          listQueryString=""
                        />
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

      <Link href="/vente/clients/archives" className="text-xs text-primary hover:underline">
        Ouvrir la page archives clients →
      </Link>
    </section>
  );
}

function ArchivedProductsSection({
  rows,
  totalCount,
}: {
  rows: AdminArchiveProductRow[];
  totalCount: number;
}) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.searchIndex.includes(q));
  }, [rows, debouncedSearch]);

  const visibleIds = filteredRows.map((r) => r.id);
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
        pushThenRefresh(router, withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(router, withAdminFlash({ error: result.error }));
      }
    });
  }

  function runBulkPurge() {
    startTransition(async () => {
      const result = await adminPermanentDeleteArchivedProductsAction(selectedIds);
      setConfirmPurgeOpen(false);
      clearSelection();
      if (result.success) {
        const msg =
          result.data.deleted === 1
            ? "1 produit définitivement supprimé."
            : `${result.data.deleted} produits définitivement supprimés.`;
        showSuccess(msg);
        pushThenRefresh(router, withAdminFlash({ success: msg }));
      } else {
        showError(result.error);
        pushThenRefresh(router, withAdminFlash({ error: result.error }));
      }
    });
  }

  const searching = debouncedSearch.trim().length > 0;
  const disableHeaderCheckbox = filteredRows.length === 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          <Package size={16} />
          Produits archivés ({totalCount}
          {searching ? ` — ${filteredRows.length} affiché${filteredRows.length > 1 ? "s" : ""}` : ""})
        </h2>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filtrer les produits (nom, SKU, description…)"
        className="max-w-xl"
      />

      <ArchiveSelectionBulkBar
        selectedCount={selectedCount}
        pluralLabel="produits"
        pending={pending}
        onClear={clearSelection}
        onOpenBulkRestore={() => setConfirmRestoreBulkOpen(true)}
        onOpenBulkPurge={() => setConfirmPurgeOpen(true)}
      />

      <Modal
        open={confirmRestoreBulkOpen}
        onClose={() => {
          if (!pending) setConfirmRestoreBulkOpen(false);
        }}
        title={`Restaurer ${selectedCount} produit${selectedCount > 1 ? "s" : ""} ?`}
        size="md"
      >
        <p className="text-sm text-darktext/80">
          Les produits sélectionnés redeviendront visibles dans le catalogue actif.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
            onClick={() => setConfirmRestoreBulkOpen(false)}
            disabled={pending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={runBulkRestore}
            disabled={pending}
          >
            {pending ? "Restauration…" : "Confirmer"}
          </button>
        </div>
      </Modal>

      <ConfirmDangerDialog
        open={confirmPurgeOpen}
        title="Supprimer définitivement la sélection ?"
        message={`${selectedCount} produit(s) seront effacés (y compris les mouvements de stock associés). Irréversible.`}
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
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={allVisibleSelected}
                    disabled={disableHeaderCheckbox || pending}
                    onChange={() => toggleAllVisible()}
                    aria-label="Sélectionner tous les produits affichés"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Produit</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Supprimé</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Par</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Aucun produit archivé.
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Aucun produit ne correspond à cette recherche.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedSet.has(row.id)}
                        disabled={pending}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Sélectionner ${row.name}`}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{row.sku}</td>
                    <td className="px-4 py-2 text-gray-600">{row.deletedAtLabel}</td>
                    <td className="px-4 py-2 text-gray-500">{row.deletedByLabel}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <RestoreArchiveButton
                          entityId={row.id}
                          entityLabel={row.name}
                          restoreAction={restoreProductAction}
                          redirectPath="/admin/archives"
                          listQueryString=""
                        />
                        <PermanentDeleteArchivedRowButton kind="product" id={row.id} label={row.name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link href="/vente/produits/archives" className="text-xs text-primary hover:underline">
        Ouvrir la page archives produits →
      </Link>
    </section>
  );
}

type AdminGlobalArchivesClientProps = {
  clients: AdminArchiveClientRow[];
  products: AdminArchiveProductRow[];
};

export function AdminGlobalArchivesClient({ clients, products }: AdminGlobalArchivesClientProps) {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search size={18} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-darktext">Recherche dans les archives</p>
            <p className="text-xs text-darktext/70">
              Chaque tableau a son propre filtre instantané (léger délai après la frappe). La sélection et les actions
              portent uniquement sur les lignes visibles après filtre.
            </p>
          </div>
        </div>
      </div>

      <ArchivedClientsSection rows={clients} totalCount={clients.length} />
      <ArchivedProductsSection rows={products} totalCount={products.length} />
    </div>
  );
}
