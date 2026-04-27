import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listProducts } from "@/lib/server/products";
import { ProductsTable } from "@/components/vente/produits/products-table";
import { getModulePermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";

type ProductsPageProps = {
  searchParams?: {
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

  const products = await listProducts();

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-darktext">Produits</h1>
            <p className="text-sm text-darktext/80">{products.length} produit(s)</p>
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

        <FlashMessage success={searchParams?.success} error={searchParams?.error} />

        <ProductsTable products={products} canUpdate={permissions.canUpdate} />
      </div>
    </main>
  );
}
