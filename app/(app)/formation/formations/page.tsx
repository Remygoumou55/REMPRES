import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationRead } from "@/lib/server/formation-access";
import { listTrainings } from "@/lib/server/formation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { TrainingStatusBadge } from "@/components/formation/training-status-badge";
import { deleteTrainingAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { q?: string; status?: string; success?: string; error?: string };
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function FormationsListPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationRead(user.id);

  const [{ data, total }] = await Promise.all([
    listTrainings({ search: searchParams?.q, status: searchParams?.status ?? "all" }),
  ]);

  const qs = new URLSearchParams();
  if (searchParams?.q) qs.set("q", searchParams.q);
  if (searchParams?.status) qs.set("status", searchParams.status);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Formations"
        subtitle={`${total} formation(s)`}
        actions={
          <Link href="/formation/formations/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher…"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={searchParams?.status ?? "all"} className="input max-w-[180px]">
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="active">Active</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <GraduationCap className="h-12 w-12 text-gray-300" />
          <p>Aucune formation</p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Titre</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Durée</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{t.title}</td>
                  <td className="p-3">{t.category ?? "—"}</td>
                  <td className="p-3">{t.duration_hours} h</td>
                  <td className="p-3">{formatGNF(Number(t.price_gnf))}</td>
                  <td className="p-3">
                    <TrainingStatusBadge status={t.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/formation/formations/${t.id}`} className="text-primary text-xs font-medium">
                        Voir
                      </Link>
                      <Link href={`/formation/formations/${t.id}?edit=1`} className="text-xs font-medium text-gray-600">
                        Modifier
                      </Link>
                      <form action={deleteTrainingAction.bind(null, t.id)}>
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
