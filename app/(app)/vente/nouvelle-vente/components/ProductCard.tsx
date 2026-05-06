"use client";

import { useState, memo } from "react";
import { Package, Plus } from "lucide-react";
import type { Product } from "@/types/product";
import type { Currency } from "@/lib/currencyService";
import { PriceText } from "./PriceText";

export const ProductCard = memo(function ProductCard({
  product,
  cartQty,
  onAdd,
  currency,
}: {
  product: Product;
  cartQty: number;
  onAdd: (p: Product) => void;
  currency: Currency;
}) {
  const [pulse, setPulse] = useState(false);
  const outOfStock  = product.stock_quantity <= 0;
  const isLowStock  = !outOfStock && product.stock_quantity <= (product.stock_threshold ?? 5);
  const atMax       = cartQty >= product.stock_quantity;

  function handleClick() {
    if (outOfStock || atMax) return;
    onAdd(product);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={`group relative flex w-full flex-col rounded-2xl border-2 p-3.5 text-left transition-all duration-200 ${
        outOfStock
          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
          : cartQty > 0
          ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
          : "cursor-pointer border-gray-100 bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-gray-200/60"
      } ${pulse ? "scale-95" : "scale-100"}`}
    >
      {/* Badge en coin */}
      {outOfStock ? (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
          Rupture
        </span>
      ) : isLowStock ? (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
          Faible
        </span>
      ) : cartQty > 0 ? (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {cartQty}
        </span>
      ) : null}

      {/* Icône + nom */}
      <div className="flex items-start gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          cartQty > 0 ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
        }`}>
          <Package size={16} />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="truncate text-sm font-semibold text-darktext leading-tight">{product.name}</p>
          <p className="text-[10px] text-gray-400 font-mono">{product.sku}</p>
        </div>
      </div>

      {/* Prix + stock */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className={`text-base font-extrabold tabular-nums ${cartQty > 0 ? "text-primary" : "text-darktext"}`}>
            <PriceText amount={product.price_gnf} currency={currency} />
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-medium ${
            outOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-gray-400"
          }`}>
            {product.stock_quantity} unité{product.stock_quantity > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Bouton Ajouter */}
      {!outOfStock && (
        <div className={`mt-2.5 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-colors ${
          atMax
            ? "bg-gray-100 text-gray-400"
            : cartQty > 0
            ? "bg-primary text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"
        }`}>
          <Plus size={12} />
          {atMax ? "Stock max" : cartQty > 0 ? "Ajouter encore" : "Ajouter"}
        </div>
      )}
    </button>
  );
});
