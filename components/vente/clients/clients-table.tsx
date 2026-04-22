import Link from "next/link";
import type { Client } from "@/types/client";

type ClientsTableProps = {
  clients: Client[];
  canUpdate?: boolean;
};

function getClientDisplayName(client: Client) {
  if (client.client_type === "company") {
    return client.company_name ?? "Entreprise sans nom";
  }

  const fullName = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
  return fullName || "Client sans nom";
}

export function ClientsTable({ clients, canUpdate = true }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-sm text-darktext/80 shadow-sm">
        Aucun client trouvé.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-primary text-left text-sm text-white">
          <tr>
            <th className="px-4 py-3 font-medium">Nom</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Téléphone</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-gray-200 text-sm text-darktext">
              <td className="px-4 py-3">{getClientDisplayName(client)}</td>
              <td className="px-4 py-3">
                {client.client_type === "company" ? "Entreprise" : "Individuel"}
              </td>
              <td className="px-4 py-3">{client.email ?? "-"}</td>
              <td className="px-4 py-3">{client.phone ?? "-"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  <Link href={`/vente/clients/${client.id}`} className="text-primary hover:underline">
                    Voir
                  </Link>
                  {canUpdate ? (
                    <Link
                      href={`/vente/clients/${client.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Modifier
                    </Link>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
