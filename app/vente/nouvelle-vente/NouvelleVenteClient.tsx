"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  X,
  Plus,
  Minus,
  Package,
  CheckCircle,
  AlertCircle,
  Printer,
  RotateCcw,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@/types/product";
import { logError } from "@/lib/logger";
import type { Client } from "@/types/client";
import { useCurrencyStore } from "@/stores/currencyStore";
import { convertAmount, formatAmount, FALLBACK_RATES, type Currency } from "@/lib/currencyService";
import { createSaleAction } from "./actions";
import { resolveErrorMessage } from "@/lib/messages";

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type CartItem = { product: Product; quantity: number };

type CompletedSale = { id: string; reference: string | null; total_amount_gnf: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAYMENT_METHODS = [
  { key: "cash" as const, label: "Espèces" },
  { key: "mobile_money" as const, label: "Mobile Money" },
  { key: "bank_transfer" as const, label: "Virement" },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];

// ---------------------------------------------------------------------------
// ProductCard
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  inCart,
  onAdd,
}: {
  product: Product;
  inCart: boolean;
  onAdd: (p: Product) => void;
}) {
  const outOfStock = product.stock_quantity <= 0;

  return (
    <button
      type="button"
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`group relative w-full rounded-lg border p-3 text-left transition-all ${
        outOfStock
          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
          : inCart
          ? "border-primary bg-primary/5 shadow-sm"
          : "cursor-pointer border-gray-200 bg-white hover:border-primary hover:shadow-sm"
      }`}
    >
      {outOfStock && (
        <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Rupture
        </span>
      )}
      {inCart && !outOfStock && (
        <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
          Dans le panier
        </span>
      )}
      <div className="flex min-h-[42px] items-start gap-2">
        <Package size={18} className="mt-0.5 shrink-0 text-gray-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-darktext">{product.name}</p>
          <p className="text-xs text-gray-400">SKU : {product.sku}</p>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-sm font-bold text-primary">
          {product.price_gnf.toLocaleString("fr-FR")} GNF
        </span>
        <span
          className={`text-xs ${
            product.stock_quantity <= product.stock_threshold
              ? "text-orange-500 font-medium"
              : "text-gray-400"
          }`}
        >
          Stock : {product.stock_quantity}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// CartRow
// ---------------------------------------------------------------------------

function CartRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
}) {
  const lineTotalGNF = item.product.price_gnf * item.quantity;

  return (
    <div className="flex items-start gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-darktext">{item.product.name}</p>
        <p className="text-xs text-gray-400">
          {item.product.price_gnf.toLocaleString("fr-FR")} GNF × {item.quantity}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdateQty(item.product.id, -1)}
          className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-darktext hover:bg-graylight"
          aria-label="Diminuer quantité"
        >
          <Minus size={12} />
        </button>
        <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdateQty(item.product.id, +1)}
          disabled={item.quantity >= item.product.stock_quantity}
          className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-darktext hover:bg-graylight disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Augmenter quantité"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="w-28 shrink-0 text-right">
        <p className="text-sm font-semibold text-darktext tabular-nums">
          {lineTotalGNF.toLocaleString("fr-FR")} GNF
        </p>
        <button
          type="button"
          onClick={() => onRemove(item.product.id)}
          className="mt-0.5 text-xs text-red-400 hover:text-red-600"
          aria-label="Supprimer du panier"
        >
          <X size={12} className="inline" /> Retirer
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SuccessModal
// ---------------------------------------------------------------------------

function SuccessModal({
  sale,
  onNewSale,
}: {
  sale: CompletedSale;
  onNewSale: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl text-center">
        <CheckCircle size={56} className="mx-auto text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-darktext">Vente enregistrée !</h2>
        {sale.reference && (
          <p className="mt-1 text-sm font-medium text-gray-500">
            Référence : <span className="font-bold text-primary">{sale.reference}</span>
          </p>
        )}
        <p className="mt-1 text-lg font-semibold text-darktext">
          Total : {sale.total_amount_gnf.toLocaleString("fr-FR")} GNF
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={`/vente/recu/${sale.id}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-darktext hover:bg-graylight"
          >
            <Printer size={16} />
            Imprimer le reçu
          </a>
          <button
            type="button"
            onClick={onNewSale}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90"
          >
            <RotateCcw size={16} />
            Nouvelle vente
          </button>
          <button
            type="button"
            onClick={() => router.push("/vente/historique")}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-darktext hover:bg-graylight"
          >
            <ClipboardList size={16} />
            Voir l&apos;historique
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClientSelector
// ---------------------------------------------------------------------------

function ClientSelector({
  clients,
  selected,
  onSelect,
}: {
  clients: Client[];
  selected: Client | null;
  onSelect: (c: Client | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const filtered = debouncedQuery
    ? clients
        .filter((c) =>
          getClientLabel(c).toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
        .slice(0, 8)
    : clients.slice(0, 8);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-darktext hover:border-primary focus:outline-none"
      >
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? getClientLabel(selected) : "Client de passage (aucun)"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client…"
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-graylight"
              >
                Client de passage (aucun)
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
                  className="w-full px-3 py-2 text-left text-sm text-darktext hover:bg-graylight"
                >
                  <span className="font-medium">{getClientLabel(c)}</span>
                  {c.phone && <span className="ml-2 text-xs text-gray-400">{c.phone}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">Aucun client trouvé</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal — NouvelleVenteClient
// ---------------------------------------------------------------------------

type Props = { products: Product[]; clients: Client[] };

export function NouvelleVenteClient({ products, clients }: Props) {
  // --- Cart ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // --- Currency (Zustand, hydratée côté client) ---
  const storeSelected = useCurrencyStore((s) => s.selectedCurrency);
  const storeRates = useCurrencyStore((s) => s.rates);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const selectedCurrency: Currency = hydrated ? storeSelected : "GNF";
  const rates = hydrated ? storeRates : FALLBACK_RATES;

  // --- Product search ---
  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(productSearch, 300);

  // --- Client ---
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // --- Payment method ---
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodKey>("cash");

  // --- Submit state ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const filteredProducts = debouncedSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : products;

  const cartIds = new Set(cart.map((i) => i.product.id));

  const subtotalGNF = cart.reduce((acc, i) => acc + i.product.price_gnf * i.quantity, 0);
  const discountAmountGNF = Math.round(subtotalGNF * (discountPercent / 100) * 100) / 100;
  const totalGNF = subtotalGNF - discountAmountGNF;

  const displaySubtotal = formatAmount(convertAmount(subtotalGNF, selectedCurrency, rates), selectedCurrency);
  const displayDiscount = formatAmount(convertAmount(discountAmountGNF, selectedCurrency, rates), selectedCurrency);
  const displayTotal = formatAmount(convertAmount(totalGNF, selectedCurrency, rates), selectedCurrency);

  // ---------------------------------------------------------------------------
  // Cart operations
  // ---------------------------------------------------------------------------

  function addToCart(product: Product) {
    if (product.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock_quantity) }
            : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const next = i.quantity + delta;
          if (next <= 0) return null;
          if (next > i.product.stock_quantity) return i;
          return { ...i, quantity: next };
        })
        .filter((i): i is CartItem => i !== null),
    );
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createSaleAction({
        clientId: selectedClient?.id ?? null,
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productSku: i.product.sku,
          quantity: i.quantity,
          unitPriceGNF: i.product.price_gnf,
          discountPercent: 0,
        })),
        discountPercent,
        paymentMethod,
        displayCurrency: selectedCurrency,
        exchangeRate: selectedCurrency === "GNF" ? 1 : (rates[selectedCurrency] ?? 1),
        notes: null,
      });

      if (result.success) {
        setCompletedSale(result.sale);
      } else {
        logError("SALE_SUBMIT", result.error, { cartSize: cart.length });
        setSubmitError(resolveErrorMessage(result.error));
      }
    } catch (err) {
      logError("SALE_SUBMIT_UNEXPECTED", err, { cartSize: cart.length });
      setSubmitError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForNewSale() {
    setCart([]);
    setDiscountPercent(0);
    setSelectedClient(null);
    setPaymentMethod("cash");
    setProductSearch("");
    setSubmitError(null);
    setCompletedSale(null);
  }

  // ---------------------------------------------------------------------------
  // Render — Success modal
  // ---------------------------------------------------------------------------

  if (completedSale) {
    return <SuccessModal sale={completedSale} onNewSale={resetForNewSale} />;
  }

  // ---------------------------------------------------------------------------
  // Render — POS
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-darktext">Nouvelle vente</h1>
          <p className="text-xs text-gray-400">{products.length} produit(s) disponible(s)</p>
        </div>
        <Link
          href="/vente/historique"
          className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-darktext hover:bg-graylight"
        >
          <ClipboardList size={15} />
          Historique des ventes
        </Link>
      </div>

      {/* 2-column layout */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">

        {/* ================================================================
            COLONNE GAUCHE — Catalogue produits
        ================================================================ */}
        <section className="flex flex-col gap-3 lg:w-[60%]">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-darktext">Choisir des produits</h2>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher par nom ou SKU…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto rounded-lg bg-white p-4 shadow-sm">
            {filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Aucun produit ne correspond à votre recherche.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    inCart={cartIds.has(p.id)}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================
            COLONNE DROITE — Panier
        ================================================================ */}
        <section className="flex flex-col gap-4 lg:w-[40%] lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg bg-white shadow-sm">
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold text-darktext">
                <ShoppingCart size={18} />
                Panier
                {cart.length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    {cart.length}
                  </span>
                )}
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Vider
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="max-h-56 overflow-y-auto px-4">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  Cliquez sur un produit pour l&apos;ajouter.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <CartRow
                      key={item.product.id}
                      item={item}
                      onRemove={removeFromCart}
                      onUpdateQty={updateQuantity}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Totals block */}
            <div className="border-t border-gray-100 px-4 py-3 space-y-3">
              {/* Sous-total + remise */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium text-darktext">{displaySubtotal}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-sm text-gray-500">Remise (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={discountPercent}
                  onChange={(e) => {
                    const v = Math.min(100, Math.max(0, Number(e.target.value)));
                    setDiscountPercent(v);
                  }}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-primary"
                />
                {discountPercent > 0 && (
                  <span className="ml-auto text-sm text-red-500">−{displayDiscount}</span>
                )}
              </div>

              {/* Currency selector */}
              <div>
                <p className="mb-1.5 text-xs text-gray-500">Devise d&apos;affichage</p>
                <div className="flex gap-1.5">
                  {(["GNF", "XOF", "USD", "EUR"] as Currency[]).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setSelectedCurrency(cur)}
                      className={`flex-1 rounded-md border py-1 text-xs font-semibold transition-colors ${
                        selectedCurrency === cur
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-darktext hover:border-primary"
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total (grand) */}
              <div className="rounded-lg bg-primary/10 px-3 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-primary/70">Total</p>
                <p className="text-3xl font-extrabold text-primary">{displayTotal}</p>
                {selectedCurrency !== "GNF" && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    = {totalGNF.toLocaleString("fr-FR")} GNF
                  </p>
                )}
              </div>
            </div>

            {/* Client + payment */}
            <div className="border-t border-gray-100 px-4 py-3 space-y-3">
              {/* Client selector */}
              <ClientSelector
                clients={clients}
                selected={selectedClient}
                onSelect={setSelectedClient}
              />

              {/* Payment method */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">Mode de paiement</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`rounded-md border py-1.5 text-xs font-medium transition-colors ${
                        paymentMethod === pm.key
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-darktext hover:border-primary"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-4 pb-4">
              {submitError && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleSubmit}
                className={`w-full rounded-lg py-3 text-sm font-bold transition-colors ${
                  cart.length === 0
                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                    : isSubmitting
                    ? "cursor-wait bg-primary/70 text-white"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Traitement en cours…
                  </span>
                ) : cart.length === 0 ? (
                  "Panier vide"
                ) : (
                  `Valider la vente — ${displayTotal}`
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
