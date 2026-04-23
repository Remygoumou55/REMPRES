import Link from "next/link";
import { Pencil, Eye, Package } from "lucide-react";
import type { Product } from "@/types/product";
import { EmptyState } from "@/components/ui/empty-state";

type ProductsTableProps = {
  products: Product[];
  canUpdate?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGNF(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " GNF";
}

function getObservation(qty: number, threshold: number): {
  label: string;
  className: string;
} {
  if (qty <= 0) return { label: "Rupture", className: "text-red-600 bg-red-50 border-red-200" };
  if (qty <= threshold) return { label: `Stock faible (${qty})`, className: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: `En stock (${qty})`, className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
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
      {/* Header info */}
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
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Désignation
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">
                Code article
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quantité
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Prix unitaire
              </th>
              <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">
                Montant
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                Observation
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => {
              const threshold   = product.stock_threshold ?? 5;
              const observation = getObservation(product.stock_quantity, threshold);
              const montant     = product.stock_quantity * product.price_gnf;

              return (
                <tr
                  key={product.id}
                  className="group transition-colors hover:bg-gray-50/60"
                >
                  {/* Désignation */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-darktext">{product.name}</p>
                        <p className="text-xs text-gray-400 sm:hidden font-mono">{product.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* Code article (SKU) */}
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-medium text-gray-600">
                      {product.sku}
                    </span>
                  </td>

                  {/* Quantité */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold tabular-nums text-darktext text-base">
                      {product.stock_quantity}
                    </span>
                  </td>

                  {/* Prix unitaire */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold tabular-nums text-darktext">
                      {formatGNF(product.price_gnf)}
                    </span>
                  </td>

                  {/* Montant = quantité × prix */}
                  <td className="hidden px-5 py-3.5 text-right md:table-cell">
                    <span className="font-bold tabular-nums text-primary">
                      {product.stock_quantity > 0 ? formatGNF(montant) : "—"}
                    </span>
                  </td>

                  {/* Observation */}
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center rounded-xl border px-2.5 py-1 text-xs font-semibold ${observation.className}`}>
                      {observation.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/vente/produits/${product.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-darktext"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Voir</span>
                      </Link>
                      {canUpdate && (
                        <Link
                          href={`/vente/produits/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
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

          {/* Pied de tableau — totaux */}
          {products.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                <td colSpan={2} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Total catalogue
                </td>
                <td className="px-5 py-3 text-right font-bold tabular-nums text-darktext">
                  {products.reduce((sum, p) => sum + p.stock_quantity, 0)}
                </td>
                <td className="px-5 py-3" />
                <td className="hidden px-5 py-3 text-right font-bold tabular-nums text-primary md:table-cell">
                  {formatGNF(products.reduce((sum, p) => sum + p.stock_quantity * p.price_gnf, 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
