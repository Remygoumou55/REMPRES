"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import type { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ClientsRowActions } from "@/components/vente/clients/clients-row-actions";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { deleteClientsFromListBulkAction } from "@/app/(app)/vente/clients/actions";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { BulkDeleteActionBar } from "@/components/ui/bulk-delete-action-bar";

type ClientsTableProps = {
  clients: Client[];
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
};

function getClientDisplayName(client: Client): string {
  if (client.client_type === "company") {
    return client.company_name ?? "Entreprise sans nom";
  }
  return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Client sans nom";
}

function getClientInitials(client: Client): string {
  const name = getClientDisplayName(client);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-primary/10 text-primary",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-orange-100 text-orange-700",
    "bg-sky-100 text-sky-700",
    "bg-pink-100 text-pink-700",
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

export function ClientsTable({
  clients,
  canUpdate = true,
  canDelete = false,
  listQueryString,
}: ClientsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const searchFields = useMemo(
    () => [
      (c: Client) => getClientDisplayName(c),
      "email" as const,
      "phone" as const,
      "city" as const,
      "company_name" as const,
      "first_name" as const,
      "last_name" as const,
    ],
    [],
  );

  const { query, setQuery, filteredData, suggestions } = useGlobalSearch<Client>({
    data: clients,
    searchFields,
    delay: 220,
  });

  const rows = filteredData;
  const {
    selectedIds,
    selectedSet,
    selectedCount,
    allVisibleSelected,
    toggleOne,
    toggleAllVisible,
    clearSelection,
  } = useRowSelection(rows.map((r) => r.id));

  function withListFlash(queryString: string, flash: { success?: string; error?: string }): string {
    const p = new URLSearchParams(queryString);
    p.delete("success");
    p.delete("error");
    if (flash.success) p.set("success", flash.success);
    if (flash.error) p.set("error", flash.error);
    const qs = p.toString();
    return qs ? `/vente/clients?${qs}` : "/vente/clients";
  }

  function runBulkDelete() {
    startTransition(async () => {
      const result = await deleteClientsFromListBulkAction(selectedIds);
      setConfirmBulkOpen(false);
      if (result.success) {
        clearSelection();
        router.push(
          withListFlash(listQueryString, {
            success: `${result.data.deleted} client(s) supprimé(s) avec succès.`,
          }),
        );
      } else {
        router.push(withListFlash(listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun client pour l'instant"
        description="Ajoutez votre premier client pour commencer à gérer votre portefeuille."
        action={
          <Link
            href={withCreateModalQuery("/vente/clients")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            + Ajouter un client
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {rows.length} client{rows.length > 1 ? "s" : ""}
        </p>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSuggestionSelect={setQuery}
          suggestions={suggestions}
          placeholder="Recherche instantanée (nom, email, téléphone, ville...)"
          className="w-full sm:w-80"
        />
      </div>
      {canDelete ? (
        <div className="border-b border-gray-100 px-5 py-3">
          <BulkDeleteActionBar
            selectedCount={selectedCount}
            itemLabel="client"
            pending={pending}
            onDelete={() => setConfirmBulkOpen(true)}
            onClear={clearSelection}
          />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {canDelete ? (
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Tout sélectionner"
                  />
                </th>
              ) : null}
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Client</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Type</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Email</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Téléphone</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((client) => {
              const name = getClientDisplayName(client);
              const initials = getClientInitials(client);
              const avatarColor = getAvatarColor(client.id);
              const isCompany = client.client_type === "company";

              return (
                <tr key={client.id} className="group transition-colors hover:bg-gray-50/60">
                  {canDelete ? (
                    <td className="px-3 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(client.id)}
                        onChange={() => toggleOne(client.id)}
                        aria-label={`Sélectionner ${name}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-darktext">{name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{isCompany ? "Entreprise" : "Particulier"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <Badge label={isCompany ? "Entreprise" : "Particulier"} variant={isCompany ? "primary" : "info"} />
                  </td>

                  <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">
                    {client.email ?? <span className="text-gray-300"></span>}
                  </td>

                  <td className="hidden px-5 py-3.5 text-gray-500 lg:table-cell">
                    {client.phone ?? <span className="text-gray-300"></span>}
                  </td>

                  <td className="px-5 py-3.5">
                    <ClientsRowActions
                      client={client}
                      name={name}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      listQueryString={listQueryString}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">Aucun client ne correspond à la recherche.</div>
      )}
      <ConfirmDangerDialog
        open={confirmBulkOpen}
        title="Supprimer la sélection"
        message={`Vous allez supprimer ${selectedCount} client(s). Cette action est une suppression logique (archivage). Continuer ?`}
        confirmLabel="Supprimer la sélection"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setConfirmBulkOpen(false)}
        onConfirm={runBulkDelete}
      />
    </div>
  );
}
