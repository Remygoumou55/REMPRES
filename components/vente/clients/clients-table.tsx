import Link from "next/link";
import { Pencil, Eye, Users } from "lucide-react";
import type { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type ClientsTableProps = {
  clients: Client[];
  canUpdate?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function ClientsTable({ clients, canUpdate = true }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun client pour l'instant"
        description="Ajoutez votre premier client pour commencer à gérer votre portefeuille."
        action={
          <Link
            href="/vente/clients/new"
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {clients.length} client{clients.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Client</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Type</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Email</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Téléphone</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.map((client) => {
              const name     = getClientDisplayName(client);
              const initials = getClientInitials(client);
              const avatarColor = getAvatarColor(client.id);
              const isCompany = client.client_type === "company";

              return (
                <tr
                  key={client.id}
                  className="group transition-colors hover:bg-gray-50/60"
                >
                  {/* Nom + avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-darktext">{name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">
                          {isCompany ? "Entreprise" : "Particulier"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <Badge
                      label={isCompany ? "Entreprise" : "Particulier"}
                      variant={isCompany ? "primary" : "info"}
                    />
                  </td>

                  {/* Email */}
                  <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">
                    {client.email ?? <span className="text-gray-300">—</span>}
                  </td>

                  {/* Téléphone */}
                  <td className="hidden px-5 py-3.5 text-gray-500 lg:table-cell">
                    {client.phone ?? <span className="text-gray-300">—</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/vente/clients/${client.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-darktext"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Voir</span>
                      </Link>
                      {canUpdate && (
                        <Link
                          href={`/vente/clients/${client.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                        >
                          <Pencil size={13} />
                          <span className="hidden sm:inline">Modifier</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
