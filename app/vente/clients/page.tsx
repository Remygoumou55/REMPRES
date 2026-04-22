import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listClients } from "@/lib/server/clients";
import { ClientsTable } from "@/components/vente/clients/clients-table";
import { getClientsPermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";

type ClientsPageProps = {
  searchParams?: {
    q?: string;
    type?: "all" | "individual" | "company";
    page?: string;
    pageSize?: "10" | "25" | "50";
    success?: string;
    error?: string;
  };
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  const permissions = await getClientsPermissions(data.user.id);
  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const q = searchParams?.q ?? "";
  const type = searchParams?.type ?? "all";
  const successMessage = searchParams?.success;
  const errorMessage = searchParams?.error;
  const page = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "10") as 10 | 25 | 50;

  const result = await listClients({ search: q, type, page, pageSize });

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    params.set("page", String(nextPage));
    params.set("pageSize", String(result.pageSize));
    return `/vente/clients?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-darktext">Clients</h1>
            <p className="text-sm text-darktext/80">{result.total} client(s) trouvé(s)</p>
          </div>
          {permissions.canCreate ? (
            <Link
              href="/vente/clients/new"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Nouveau client
            </Link>
          ) : null}
        </div>
        <FlashMessage success={successMessage} error={errorMessage} />

        <form className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher (nom, email, téléphone)"
            className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
          />
          <select
            name="type"
            defaultValue={type}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">Tous les types</option>
            <option value="individual">Individuel</option>
            <option value="company">Entreprise</option>
          </select>
          <select
            name="pageSize"
            defaultValue={String(result.pageSize)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white sm:col-span-4"
          >
            Filtrer
          </button>
        </form>

        <ClientsTable clients={result.data} canUpdate={permissions.canUpdate} />

        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-darktext/80">
            Page {result.page} / {result.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={result.page > 1 ? buildUrl(result.page - 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page > 1
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Précédent
            </Link>
            <Link
              href={result.page < result.totalPages ? buildUrl(result.page + 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page < result.totalPages
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Suivant
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
