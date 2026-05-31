"use client";

import { memo, useMemo, useState, useTransition, useCallback } from "react";
import { Users } from "lucide-react";
import type { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ClientsRowActions } from "@/components/vente/clients/clients-row-actions";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { GLOBAL_LIST_SEARCH_DEBOUNCE_MS } from "@/lib/data-listing";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { deleteClientsFromListBulkAction } from "@/app/(app)/vente/clients/actions";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { BulkDeleteActionBar } from "@/components/ui/bulk-delete-action-bar";
import { ListSearchToolbar } from "@/components/ui/list-search-toolbar";
import { useToast } from "@/components/providers/ToastProvider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientDisplayName(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise sans nom";
  return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Client sans nom";
}

function getClientInitials(client: Client): string {
  const name = getClientDisplayName(client);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = ["bg-primary/10 text-primary", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-orange-100 text-orange-700", "bg-sky-100 text-sky-700", "bg-pink-100 text-pink-700"];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ClientDataRow = memo(function ClientDataRow({
  client,
  checked,
  canUpdate,
  canDelete,
  listQueryString,
  onToggle,
}: {
  client: Client;
  checked: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
  onToggle: (id: string) => void;
}) {
  const name = getClientDisplayName(client);
  const initials = getClientInitials(client);
  const avatarColor = getAvatarColor(client.id);
  const isCompany = client.client_type === "company";

  return (
    <tr className="group transition-colors hover:bg-gray-50/60">
      {canDelete && (
        <td className="px-3 py-3.5">
          <input type="checkbox" checked={checked} onChange={() => onToggle(client.id)} />
        </td>
      )}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}>{initials}</div>
          <div>
            <p className="font-medium text-darktext">{name}</p>
            <p className="text-xs text-gray-400 sm:hidden">{isCompany ? "Entreprise" : "Particulier"}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-5 py-3.5 sm:table-cell">
        <Badge label={isCompany ? "Entreprise" : "Particulier"} variant={isCompany ? "primary" : "info"} />
      </td>
      <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">{client.email ?? "-"}</td>
      <td className="hidden px-5 py-3.5 text-gray-500 lg:table-cell">{client.phone ?? "-"}</td>
      <td className="px-5 py-3.5">
        <ClientsRowActions client={client} name={name} canUpdate={canUpdate} canDelete={canDelete} listQueryString={listQueryString} />
      </td>
    </tr>
  );
});

// ---------------------------------------------------------------------------
// Virtualized Table Body (Isolated for performance)
// ---------------------------------------------------------------------------

const VIRTUAL_ROW_HEIGHT = 56;
const VIRTUAL_VIEWPORT_HEIGHT = 560;
const VIRTUAL_OVERSCAN = 8;

const VirtualClientsBody = memo(function VirtualClientsBody({
  rows,
  isVirtualized,
  selectedSet,
  toggleOne,
  canUpdate,
  canDelete,
  listQueryString,
  canDeleteColCount,
}: {
  rows: Client[];
  isVirtualized: boolean;
  selectedSet: Set<string>;
  toggleOne: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
  canDeleteColCount: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleCount = Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);

  const visibleRows = isVirtualized ? rows.slice(startIndex, endIndex) : rows;
  const topSpacer = isVirtualized ? startIndex * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacer = isVirtualized ? Math.max(0, (rows.length - endIndex) * VIRTUAL_ROW_HEIGHT) : 0;

  return (
    <div 
      className={`overflow-x-auto ${isVirtualized ? "max-h-[560px] overflow-y-auto" : ""}`}
      onScroll={isVirtualized ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
    >
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-50">
          {isVirtualized && topSpacer > 0 && (
            <tr aria-hidden="true"><td colSpan={canDeleteColCount} style={{ height: `${topSpacer}px`, padding: 0 }} /></tr>
          )}
          {visibleRows.map((client) => (
            <ClientDataRow
              key={client.id}
              client={client}
              checked={selectedSet.has(client.id)}
              canUpdate={canUpdate}
              canDelete={canDelete}
              listQueryString={listQueryString}
              onToggle={toggleOne}
            />
          ))}
          {isVirtualized && bottomSpacer > 0 && (
            <tr aria-hidden="true"><td colSpan={canDeleteColCount} style={{ height: `${bottomSpacer}px`, padding: 0 }} /></tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const VIRTUALIZE_THRESHOLD = 80;

export function ClientsTable({
  clients,
  canUpdate = true,
  canDelete = false,
  listQueryString,
}: {
  clients: Client[];
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
}) {
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const searchFields = useMemo(() => [
    (c: Client) => getClientDisplayName(c),
    "email",
    "phone",
    "city",
    "company_name"
  ], []);
  
  const { query, setQuery, filteredData, suggestions } = useGlobalSearch<Client>({
    data: clients,
    searchFields: searchFields as Parameters<typeof useGlobalSearch<Client>>[0]["searchFields"],
    delay: GLOBAL_LIST_SEARCH_DEBOUNCE_MS,
  });

  const rows = filteredData;
  const isVirtualized = rows.length > VIRTUALIZE_THRESHOLD;

  const { selectedIds, selectedSet, selectedCount, allVisibleSelected, toggleOne, toggleAllVisible, clearSelection } = 
    useRowSelection(useMemo(() => rows.map((r) => r.id), [rows]));

  const runBulkDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteClientsFromListBulkAction(selectedIds);
      setConfirmBulkOpen(false);
      if (result.success) {
        clearSelection();
        showSuccess(`${result.data.deleted} clients supprimés.`);
        pushThenRefresh(`/vente/clients?success=bulk_deleted`);
      } else {
        showError(result.error);
      }
    });
  }, [selectedIds, clearSelection, showSuccess, showError, pushThenRefresh]);

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun client"
        description="Ajoutez votre premier client."
        action={
          <PrimaryActionButton href={withCreateModalQuery("/vente/clients")}>
            Nouveau client
          </PrimaryActionButton>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <ListSearchToolbar summary={`${rows.length} client${rows.length === 1 ? "" : "s"}`}>
        <SearchInput
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
          placeholder="Rechercher…"
          className="w-full"
        />
      </ListSearchToolbar>

      {canDelete && (
        <div className="border-b border-gray-100 px-5 py-3">
          <BulkDeleteActionBar selectedCount={selectedCount} itemLabel="client" pending={pending} onDelete={() => setConfirmBulkOpen(true)} onClear={clearSelection} />
        </div>
      )}

      {/* STABLE HEADER */}
      <table className="w-full text-sm border-b border-gray-100 bg-gray-50/60">
        <thead>
          <tr className="text-xs font-semibold uppercase text-gray-400">
            {canDelete && <th className="w-10 px-3 py-3 text-left"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>}
            <th className="px-5 py-3 text-left">Client</th>
            <th className="hidden px-5 py-3 text-left sm:table-cell">Type</th>
            <th className="hidden px-5 py-3 text-left md:table-cell">Email</th>
            <th className="hidden px-5 py-3 text-left lg:table-cell">Téléphone</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
      </table>

      {/* ISOLATED BODY */}
      <VirtualClientsBody
        rows={rows}
        isVirtualized={isVirtualized}
        selectedSet={selectedSet}
        toggleOne={toggleOne}
        canUpdate={canUpdate}
        canDelete={canDelete}
        listQueryString={listQueryString}
        canDeleteColCount={canDelete ? 6 : 5}
      />

      {rows.length === 0 && (
        <div className="border-t border-gray-100 px-5 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">Aucun résultat pour cette recherche</p>
          <p className="mt-1 text-xs text-gray-400">Modifiez les critères ou effacez la recherche.</p>
        </div>
      )}
      
      <ConfirmDangerDialog open={confirmBulkOpen} title="Supprimer ?" message={`Supprimer ${selectedCount} clients ?`} loading={pending} onCancel={() => setConfirmBulkOpen(false)} onConfirm={runBulkDelete} />
    </div>
  );
}
