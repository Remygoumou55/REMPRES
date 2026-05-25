import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Eye, Plus, Truck, UserX } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import { listSuppliers } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { SupplierStatusBadge } from "@/components/logistique/logistique-badges";
import { toggleSupplierStatusAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    q?: string;
    status?: string;
    success?: string;
    error?: string;
  };
};

export default async function FournisseursPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const status =
    (["active", "inactive", "all"] as const).find(
      (s) => s === (searchParams?.status ?? "all"),
    ) ?? "all";

  const { data, total } = await listSuppliers({
    search: searchParams?.q,
    status,
  });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Fournisseurs"
        subtitle={`${total} fournisseur${total > 1 ? "s" : ""}`}
        actions={
          <Link
            href="/logistique/fournisseurs/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un fournisseur
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher par nom, contact, email…"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={status} className="input max-w-[160px]">
          <option value="all">Tous</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Truck className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun fournisseur</p>
          <p className="text-xs">
            Cliquez sur « Ajouter un fournisseur » pour créer votre premier fournisseur.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Nom</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Téléphone</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-darktext">{s.name}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {s.supplier_code}
                    </div>
                  </td>
                  <td className="p-3">{s.contact_name ?? "—"}</td>
                  <td className="p-3 text-xs text-gray-600">{s.email ?? "—"}</td>
                  <td className="p-3 text-xs text-gray-600">{s.phone ?? "—"}</td>
                  <td className="p-3 text-xs">{s.category ?? "—"}</td>
                  <td className="p-3">
                    <SupplierStatusBadge isActive={s.is_active} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/logistique/fournisseurs/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Link>
                      <Link
                        href={`/logistique/fournisseurs/${s.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
                      >
                        <Edit className="h-3.5 w-3.5" /> Modifier
                      </Link>
                      <form
                        action={toggleSupplierStatusAction.bind(
                          null,
                          s.id,
                          !s.is_active,
                        )}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          {s.is_active ? "Désactiver" : "Réactiver"}
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
