"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product } from "@/types/product";
import { useRealtimeList } from "@/hooks/useRealtimeList";
import { RealtimeLiveBadge } from "@/components/ui/RealtimeLiveBadge";

type ProductsRealtimeContextValue = {
  products: Product[];
  isLive: boolean;
};

const ProductsRealtimeContext = createContext<ProductsRealtimeContextValue | null>(
  null,
);

export function useProductsRealtime(): ProductsRealtimeContextValue {
  const ctx = useContext(ProductsRealtimeContext);
  if (!ctx) {
    throw new Error("useProductsRealtime must be used within ProductsRealtimeProvider");
  }
  return ctx;
}

export function ProductsRealtimeProvider({
  initialProducts,
  children,
}: {
  initialProducts: Product[];
  children: React.ReactNode;
}) {
  const { data, isLive } = useRealtimeList<Product>({
    table: "products",
    initialData: initialProducts,
    mode: "optimistic",
  });

  const value = useMemo(
    () => ({ products: data, isLive }),
    [data, isLive],
  );

  return (
    <ProductsRealtimeContext.Provider value={value}>
      {children}
    </ProductsRealtimeContext.Provider>
  );
}

export function ProductsRealtimeSubtitle({ count }: { count: number }) {
  const { isLive } = useProductsRealtime();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>
        {count} produit{count > 1 ? "s" : ""} catalogue.
      </span>
      {isLive ? <RealtimeLiveBadge /> : null}
    </span>
  );
}
