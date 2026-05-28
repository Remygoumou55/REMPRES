import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationRead } from "@/lib/server/formation-access";
import { listTrainees } from "@/lib/server/formation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { softDeleteTraineeAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { q?: string; success?: string; error?: string } };

export default async function ApprenantsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationRead(user.id);

  const { data, total } = await listTrainees({ search: searchParams?.q });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Apprenants"
        subtitle={`${total} apprenant(s)`}
        actions={
          <Link href="/formation/apprenants/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Ajouter un apprenant
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6">
        <input name="q" defaultValue={searchParams?.q ?? ""} placeholder="Nom ou email…" className="input max-w-sm" />
        <button type="submit" className="btn-secondary ml-2 text-sm">
          Rechercher
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Users className="h-12 w-12 text-gray-300" />
          <p>Aucun apprenant</p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Nom</th>
                <th className="p-3">Email</th>
                <th className="p-3">Téléphone</th>
                <th className="p-3">Entreprise</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/formation/apprenants/${t.id}`}
                      className="font-medium text-gray-900 transition-colors hover:text-blue-600"
                    >
                      {t.first_name} {t.last_name}
                    </Link>
                  </td>
                  <td className="p-3">{t.email ?? "—"}</td>
                  <td className="p-3">{t.phone ?? "—"}</td>
                  <td className="p-3">{t.company ?? "—"}</td>
                  <td className="p-3">
                    <form action={softDeleteTraineeAction.bind(null, t.id)}>
                      <button type="submit" className="text-xs font-medium text-red-600">
                        Supprimer
                      </button>
                    </form>
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
