import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { listArchivedProducts } from "@/lib/server/products";
import type { Product } from "@/types/product";
import { getProfileLabelsByIds } from "@/lib/server/profile-display";
import { FlashMessage } from "@/components/ui/flash-message";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { formatGNF } from "@/lib/utils/formatCurrency";
import { restoreProductAction } from "@/app/(app)/vente/produits/actions";
import { PageHeader } from "@/components/ui/page-header";

const MODULE_KEYS = ["produits", "vente"] as const;

export const metadata = { title: "Produits archivés" };

type PageProps = {
  searchParams?: { success?: string; error?: string };
};

function safeDecode(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}


export default async function ProduitsArchivesPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const permissions = await getModulePermissions(data.user.id, [...MODULE_KEYS]);
  if (!permissions.canRead) redirect("/access-denied");
  if (!permissions.canDelete) redirect("/access-denied");

  let products: Product[] = [];
  try {
    products = await listArchivedProducts();
  } catch {
    redirect("/access-denied");
  }

  const deletedByIds = products.map((p) => p.deleted_by).filter((id): id is string => Boolean(id));
  const actorLabels = await getProfileLabelsByIds(deletedByIds);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Produits archivés"
        subtitle={`${products.length} produit(s) supprimé(s) (logique)`}
        actions={
          <Link
            href="/vente/produits"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-darktext hover:bg-gray-50"
          >
            ← Catalogue actif
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
                  Produit
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">
                  SKU
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Prix
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="text-gray-200" size={28} />
                      Aucun produit archivé.
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const byLabel =
                    product.deleted_by && actorLabels[product.deleted_by]
                      ? actorLabels[product.deleted_by]
                      : product.deleted_by
                        ? product.deleted_by.slice(0, 8) + "…"
                        : "—";
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-semibold text-darktext">{product.name}</td>
                      <td className="hidden px-5 py-3.5 font-mono text-xs text-gray-600 sm:table-cell">
                        {product.sku}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {formatGNF(product.price_gnf)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {product.deleted_at
                          ? new Date(product.deleted_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">{byLabel}</td>
                      <td className="px-5 py-3.5 text-right">
                        <RestoreArchiveButton
                          entityId={product.id}
                          entityLabel={product.name}
                          restoreAction={restoreProductAction}
                          redirectPath="/vente/produits/archives"
                          listQueryString=""
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
    </div>
  );
}
