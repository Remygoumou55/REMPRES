import Link from "next/link";
import { Pencil, Eye, Package } from "lucide-react";
import type { Product } from "@/types/product";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type ProductsTableProps = {
  products: Product[];
  canUpdate?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " GNF";
}

function getStockBadge(qty: number, threshold: number): { label: string; variant: BadgeVariant; dot: boolean } {
  if (qty === 0)         return { label: "Rupture",       variant: "danger",  dot: true };
  if (qty <= threshold)  return { label: "Stock faible",  variant: "warning", dot: true };
  return                        { label: "En stock",       variant: "success", dot: true };
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function ProductsTable({ products, canUpdate = true }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucun produit pour l'instant"
        description="Ajoutez votre premier produit pour commencer à gérer votre catalogue."
        action={
          <Link
            href="/vente/produits/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            + Ajouter un produit
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {products.length} produit{products.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Produit</th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">SKU</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Prix</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Stock</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => {
              const threshold  = product.stock_threshold ?? 5;
              const stockBadge = getStockBadge(product.stock_quantity, threshold);

              return (
                <tr
                  key={product.id}
                  className="group transition-colors hover:bg-gray-50/60"
                >
                  {/* Nom + icône */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-darktext">{product.name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{product.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                      {product.sku}
                    </span>
                  </td>

                  {/* Prix */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold tabular-nums text-darktext">
                      {formatPrice(product.price_gnf)}
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        label={stockBadge.label}
                        variant={stockBadge.variant}
                        dot={stockBadge.dot}
                      />
                      <span className="text-xs tabular-nums text-gray-400">
                        {product.stock_quantity} unité{product.stock_quantity !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/vente/produits/${product.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-darktext"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Voir</span>
                      </Link>
                      {canUpdate && (
                        <Link
                          href={`/vente/produits/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                        >
                          <Pencil size={13} />
                          <span className="hidden sm:inline">Modifier</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
