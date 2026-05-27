"use client";

import { ProductsTable } from "@/components/vente/produits/products-table";
import { useProductsRealtime } from "@/components/vente/produits/ProductsRealtimeProvider";

type Props = {
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
};

export function ProductsTableLive({
  canUpdate,
  canDelete,
  listQueryString,
}: Props) {
  const { products } = useProductsRealtime();
  return (
    <ProductsTable
      products={products}
      canUpdate={canUpdate}
      canDelete={canDelete}
      listQueryString={listQueryString}
    />
  );
}
