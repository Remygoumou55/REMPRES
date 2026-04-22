import Link from "next/link";
import type { Product } from "@/types/product";

type ProductsTableProps = {
  products: Product[];
  canUpdate?: boolean;
};

export function ProductsTable({ products, canUpdate = true }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-sm text-darktext/80 shadow-sm">
        Aucun produit trouvé.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-primary text-left text-sm text-white">
          <tr>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Nom</th>
            <th className="px-4 py-3 font-medium">Prix (GNF)</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock = product.stock_quantity <= product.stock_threshold;
            return (
              <tr key={product.id} className="border-t border-gray-200 text-sm text-darktext">
                <td className="px-4 py-3">{product.sku}</td>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">{product.price_gnf}</td>
                <td className="px-4 py-3">
                  <span className={isLowStock ? "text-danger font-medium" : ""}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/vente/produits/${product.id}`} className="text-primary hover:underline">
                      Voir
                    </Link>
                    {canUpdate ? (
                      <Link
                        href={`/vente/produits/${product.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Modifier
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

