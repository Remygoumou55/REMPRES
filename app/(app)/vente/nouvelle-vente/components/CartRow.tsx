"use client";

import { memo } from "react";
import { Package, Plus, Minus, X } from "lucide-react";
import type { Product } from "@/types/product";
import type { Currency } from "@/lib/currencyService";
import { PriceText } from "./PriceText";

type CartItem = { product: Product; quantity: number };

export const CartRow = memo(function CartRow({
  item,
  onRemove,
  onUpdateQty,
  currency,
  compact = false,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  currency: Currency;
  /** Ligne ultra-compacte pour le modal panier (pas de scroll) */
  compact?: boolean;
}) {
  const lineTotal = item.product.price_gnf * item.quantity;
  const atMax = item.quantity >= item.product.stock_quantity;

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-transparent px-1 py-1 transition-colors hover:border-gray-100 hover:bg-gray-50/80">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package size={12} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-darktext">{item.product.name}</p>
          <p className="truncate text-[10px] text-gray-400 tabular-nums">
            <PriceText amount={item.product.price_gnf} currency={currency} /> × {item.quantity}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onUpdateQty(item.product.id, -1)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            aria-label="Diminuer"
          >
            <Minus size={10} />
          </button>
          <span className="w-6 text-center text-xs font-bold tabular-nums text-darktext">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQty(item.product.id, +1)}
            disabled={atMax}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Augmenter"
          >
            <Plus size={10} />
          </button>
        </div>
        <div className="w-[4.5rem] shrink-0 text-right">
          <p className="text-[11px] font-bold tabular-nums text-darktext leading-tight">
            <PriceText amount={lineTotal} currency={currency} />
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-300 transition hover:bg-red-50 hover:text-red-500"
          title="Retirer"
          aria-label="Retirer du panier"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50">
      {/* Icône */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Package size={14} />
      </div>

      {/* Infos produit */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-darktext">{item.product.name}</p>
        <p className="text-xs text-gray-400">
          <PriceText amount={item.product.price_gnf} currency={currency} /> / unité
        </p>
      </div>

      {/* Contrôles quantité */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdateQty(item.product.id, -1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          aria-label="Diminuer"
        >
          <Minus size={11} />
        </button>
        <span className="w-8 text-center text-sm font-bold tabular-nums text-darktext">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQty(item.product.id, +1)}
          disabled={atMax}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Augmenter"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Total ligne */}
      <div className="w-24 shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-darktext"><PriceText amount={lineTotal} currency={currency} /></p>
        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="mt-0.5 hidden text-xs text-gray-300 transition hover:text-red-400 group-hover:inline-flex items-center gap-0.5"
        >
          <X size={10} />retirer
        </button>
      </div>
    </div>
  );
});
