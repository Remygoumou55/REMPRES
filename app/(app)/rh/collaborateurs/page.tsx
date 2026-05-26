import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Eye, Plus, UserX, Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead } from "@/lib/server/rh-access";
import { listEmployees, listEmployeeDepartments } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  ContractTypeBadge,
  EmployeeAvatar,
  EmployeeStatusBadge,
} from "@/components/rh/rh-badges";
import { deactivateEmployeeAction } from "./actions";
import { CollaborateursExportButton } from "@/components/rh/CollaborateursExportButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    q?: string;
    department?: string;
    status?: string;
    success?: string;
    error?: string;
  };
};

export default async function CollaborateursPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const [{ data, total }, departments] = await Promise.all([
    listEmployees({
      search: searchParams?.q,
      department: searchParams?.department ?? "all",
      status: searchParams?.status ?? "all",
    }),
    listEmployeeDepartments(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Collaborateurs"
        subtitle={`${total} collaborateur${total > 1 ? "s" : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CollaborateursExportButton employees={data} />
            <Link
              href="/rh/collaborateurs/new"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Ajouter un collaborateur
            </Link>
          </div>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher par nom, email, poste…"
          className="input max-w-xs"
        />
        <select
          name="department"
          defaultValue={searchParams?.department ?? "all"}
          className="input max-w-[200px]"
        >
          <option value="all">Tous les départements</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams?.status ?? "all"}
          className="input max-w-[160px]"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Users className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun collaborateur</p>
          <p className="text-xs">
            Cliquez sur « Ajouter un collaborateur » pour démarrer.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Collaborateur</th>
                <th className="p-3">Poste</th>
                <th className="p-3">Département</th>
                <th className="p-3">Contrat</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar firstName={e.first_name} lastName={e.last_name} />
                      <div className="min-w-0">
                        <div className="font-medium text-darktext">
                          {e.first_name} {e.last_name}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {e.email ?? "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{e.position}</td>
                  <td className="p-3">{e.department}</td>
                  <td className="p-3">
                    <ContractTypeBadge type={e.contract_type} />
                  </td>
                  <td className="p-3">
                    <EmployeeStatusBadge isActive={e.is_active} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/rh/collaborateurs/${e.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                        aria-label="Voir"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Link>
                      <Link
                        href={`/rh/collaborateurs/${e.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
                        aria-label="Modifier"
                      >
                        <Edit className="h-3.5 w-3.5" /> Modifier
                      </Link>
                      {e.is_active ? (
                        <form action={deactivateEmployeeAction.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                            aria-label="Désactiver"
                          >
                            <UserX className="h-3.5 w-3.5" /> Désactiver
                          </button>
                        </form>
                      ) : null}
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
