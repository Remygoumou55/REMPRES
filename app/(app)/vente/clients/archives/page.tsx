import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getClientsPermissions } from "@/lib/server/permissions";
import { listArchivedClients } from "@/lib/server/clients";
import type { Client } from "@/types/client";
import { getProfileLabelsByIds } from "@/lib/server/profile-display";
import { FlashMessage } from "@/components/ui/flash-message";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { restoreClientAction } from "@/app/(app)/vente/clients/actions";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Clients archivés" };

type PageProps = {
  searchParams?: { page?: string; success?: string; error?: string };
};

function safeDecode(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getClientDisplayName(client: Client): string {
  if (client.client_type === "company") {
    return client.company_name ?? "Entreprise";
  }
  return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Client";
}

export default async function ClientsArchivesPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const permissions = await getClientsPermissions(data.user.id);
  if (!permissions.canRead) redirect("/access-denied");
  if (!permissions.canDelete) redirect("/access-denied");

  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  let result;
  try {
    result = await listArchivedClients({ page, pageSize: 25 });
  } catch {
    redirect("/access-denied");
  }

  const deletedByIds = result.data.map((c) => c.deleted_by).filter((id): id is string => Boolean(id));
  const actorLabels = await getProfileLabelsByIds(deletedByIds);

  const listParams = new URLSearchParams();
  listParams.set("page", String(page));
  const listQueryString = listParams.toString();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Clients archivés"
        subtitle={`${result.total} client(s) supprimé(s) (logique)`}
        actions={
          <Link
            href="/vente/clients"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-darktext hover:bg-gray-50"
          >
            ← Liste active
          </Link>
        }
      />

      <FlashMessage success={safeDecode(searchParams?.success)} error={safeDecode(searchParams?.error)} />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Client
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Supprimé le
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">
                  Par
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    Aucun client archivé.
                  </td>
                </tr>
              ) : (
                result.data.map((client) => {
                  const name = getClientDisplayName(client);
                  const byLabel =
                    client.deleted_by && actorLabels[client.deleted_by]
                      ? actorLabels[client.deleted_by]
                      : client.deleted_by
                        ? client.deleted_by.slice(0, 8) + "…"
                        : "—";
                  return (
                    <tr key={client.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-darktext">{name}</td>
                      <td className="hidden px-5 py-3.5 text-gray-500 sm:table-cell">
                        {client.email ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {client.deleted_at
                          ? new Date(client.deleted_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">{byLabel}</td>

                      <td className="px-5 py-3.5 text-right">
                        <RestoreArchiveButton
                          entityId={client.id}
                          entityLabel={name}
                          restoreAction={restoreClientAction}
                          redirectPath="/vente/clients/archives"
                          listQueryString={listQueryString}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {result.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          {page > 1 ? (
            <Link
              href={`/vente/clients/archives?page=${page - 1}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            >
              Précédent
            </Link>
          ) : null}
          {page < result.totalPages ? (
            <Link
              href={`/vente/clients/archives?page=${page + 1}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            >
              Suivant
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
