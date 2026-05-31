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
import {
  ClientsTableColGroup,
  clientsTableHeadClass,
  clientsTdClass,
  clientsThClass,
} from "@/components/vente/clients/clients-table-columns";

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
        <td className={clientsTdClass}>
          <input type="checkbox" checked={checked} onChange={() => onToggle(client.id)} aria-label={`Sélectionner ${name}`} />
        </td>
      )}
      <td className={clientsTdClass}>
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}>{initials}</div>
          <div className="min-w-0">
            <p className="truncate font-medium text-darktext">{name}</p>
            <p className="text-xs text-gray-400 sm:hidden">{isCompany ? "Entreprise" : "Particulier"}</p>
          </div>
        </div>
      </td>
      <td className={`hidden ${clientsTdClass} sm:table-cell`}>
        <Badge label={isCompany ? "Entreprise" : "Particulier"} variant={isCompany ? "primary" : "info"} />
      </td>
      <td className={`hidden ${clientsTdClass} text-gray-600 md:table-cell`}>
        <span className="block truncate" title={client.email ?? undefined}>{client.email ?? "—"}</span>
      </td>
      <td className={`hidden ${clientsTdClass} text-gray-600 lg:table-cell`}>
        <span className="block truncate tabular-nums" title={client.phone ?? undefined}>{client.phone ?? "—"}</span>
      </td>
      <td className={`${clientsTdClass} text-right`}>
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
  const [scrollTop, setScrollTop] = useState(0);

  const colCount = canDelete ? 6 : 5;
  const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleCount = Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const visibleRows = isVirtualized ? rows.slice(startIndex, endIndex) : rows;
  const topSpacer = isVirtualized ? startIndex * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacer = isVirtualized ? Math.max(0, (rows.length - endIndex) * VIRTUAL_ROW_HEIGHT) : 0;

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

      <div className="overflow-x-auto">
        <div
          className={isVirtualized ? "max-h-[560px] overflow-y-auto" : undefined}
          onScroll={isVirtualized ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
        >
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <ClientsTableColGroup canDelete={canDelete} />
            <thead className={clientsTableHeadClass}>
              <tr>
                {canDelete ? (
                  <th className={clientsThClass}>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Tout sélectionner" />
                  </th>
                ) : null}
                <th className={clientsThClass}>Client</th>
                <th className={`hidden ${clientsThClass} sm:table-cell`}>Type</th>
                <th className={`hidden ${clientsThClass} md:table-cell`}>Email</th>
                <th className={`hidden ${clientsThClass} lg:table-cell`}>Téléphone</th>
                <th className={`${clientsThClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isVirtualized && topSpacer > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={colCount} style={{ height: topSpacer, padding: 0, border: 0 }} />
                </tr>
              ) : null}
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
              {isVirtualized && bottomSpacer > 0 ? (
                <tr aria-hidden="true">
                  <td colSpan={colCount} style={{ height: bottomSpacer, padding: 0, border: 0 }} />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

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
