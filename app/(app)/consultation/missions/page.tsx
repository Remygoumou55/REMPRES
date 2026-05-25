import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationRead } from "@/lib/server/consultation-access";
import { listMissions } from "@/lib/server/consultation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { MissionStatusBadge } from "@/components/consultation/mission-status-badge";
import { deleteMissionAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { q?: string; status?: string; success?: string; error?: string } };

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function MissionsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationRead(user.id);

  const { data, total } = await listMissions({
    search: searchParams?.q,
    status: searchParams?.status ?? "all",
  });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Missions"
        subtitle={`${total} mission(s)`}
        actions={
          <Link href="/consultation/missions/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Nouvelle mission
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={searchParams?.q ?? ""} placeholder="Rechercher…" className="input max-w-xs" />
        <select name="status" defaultValue={searchParams?.status ?? "all"} className="input max-w-[180px]">
          <option value="all">Tous</option>
          <option value="draft">Brouillon</option>
          <option value="active">Active</option>
          <option value="on_hold">En pause</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Briefcase className="h-12 w-12 text-gray-300" />
          <p>Aucune mission</p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Référence</th>
                <th className="p-3">Titre</th>
                <th className="p-3">Client</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{m.reference}</td>
                  <td className="p-3 font-medium">{m.title}</td>
                  <td className="p-3">{m.client_name ?? "—"}</td>
                  <td className="p-3">
                    <MissionStatusBadge status={m.status} />
                  </td>
                  <td className="p-3">{formatGNF(Number(m.budget_gnf))}</td>
                  <td className="p-3 text-xs">
                    {m.start_date ?? "—"} → {m.end_date ?? "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/consultation/missions/${m.id}`} className="text-xs font-medium text-primary">
                        Voir
                      </Link>
                      <form action={deleteMissionAction.bind(null, m.id)}>
                        <button type="submit" className="text-xs font-medium text-red-600">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
