import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listProducts } from "@/lib/server/products";
import { getModulePermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { ProductsTable } from "@/components/vente/produits/products-table";

type ProductsPageProps = {
  searchParams?: {
    q?: string;
    page?: string;
    pageSize?: "10" | "25" | "50";
    success?: string;
    error?: string;
  };
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const q = searchParams?.q ?? "";
  const successMessage = searchParams?.success;
  const errorMessage = searchParams?.error;
  const page = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "10") as 10 | 25 | 50;

  const result = await listProducts({ search: q, page, pageSize });

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(nextPage));
    params.set("pageSize", String(result.pageSize));
    return `/vente/produits?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-darktext">Produits</h1>
          <p className="text-sm text-darktext/80">{result.total} produit(s) trouvé(s)</p>
        </div>
        {permissions.canCreate ? (
          <Link
            href="/vente/produits/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Nouveau produit
          </Link>
        ) : null}
      </div>

      <FlashMessage success={successMessage} error={errorMessage} />

      <form className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher (SKU, nom)"
          className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-3"
        />
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

      <ProductsTable products={result.data} canUpdate={permissions.canUpdate} />

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
  );
}

