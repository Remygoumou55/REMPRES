import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdminArchivesAdmin } from "@/lib/server/archives";
import { fetchExportHubProducts } from "@/lib/admin/export-hub-data";
import { AdminExportHubPanel } from "@/components/admin/exports/AdminExportHubPanel";
import { ProductsExportButton } from "@/components/vente/produits/ProductsExportButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Export produits — Admin",
};

export default async function AdminExportProductsPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertSuperAdminArchivesAdmin(user.id);

  const products = await fetchExportHubProducts();

  return (
    <AdminExportHubPanel
      title="Export produits (Vente)"
      description="Catalogue produits actif — prix, stock et références. Export Excel ou PDF pour analyse ou archivage."
      count={products.length}
      countLabel={`produit${products.length > 1 ? "s" : ""} actif${products.length > 1 ? "s" : ""}`}
      exportAction={<ProductsExportButton products={products} />}
    />
  );
}
