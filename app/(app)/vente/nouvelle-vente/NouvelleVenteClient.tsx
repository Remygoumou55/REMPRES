"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  X,
  Package,
  AlertCircle,
  History,
  Loader2,
  Trash2,
  CheckCircle,
} from "lucide-react";
import type { Product } from "@/types/product";
import type { Client } from "@/types/client";
import { logError } from "@/lib/logger";
import { useCurrencyStore } from "@/stores/currencyStore";
import { convertGnfWithRates, FALLBACK_RATES, type Currency } from "@/lib/currencyService";
import { resolveErrorMessage, ERROR_CODES } from "@/lib/messages";
import { formatCurrency } from "@/utils/currency";
import { useSales } from "@/hooks/useSales";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/providers/ToastProvider";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { useDebounce } from "@/hooks/useDebounce";

// Sub-components
import { PriceText } from "./components/PriceText";
import { ProductCard } from "./components/ProductCard";
import { CartRow } from "./components/CartRow";
import { ClientSelector } from "./components/ClientSelector";
import { SuccessContent } from "./components/SuccessContent";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 300;

const PAYMENT_METHODS = [
  { key: "cash"          as const, label: "Espèces" },
  { key: "mobile_money"  as const, label: "Mobile Money" },
  { key: "orange_money"  as const, label: "Orange Money" },
  { key: "bank_transfer" as const, label: "Virement" },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];
const CURRENCIES: Currency[] = ["GNF", "XOF", "USD", "EUR"];

type CartItem = { product: Product; quantity: number };
type CompletedSale = {
  id: string;
  reference: string | null;
  total_amount_gnf: number;
  displayTotal: string;
};

type Props = { products: Product[]; clients: Client[] };

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NouvelleVenteClient({ products, clients }: Props) {
  const { submitSale } = useSales();
  const { showSuccess, showError } = useToast();
  const { refreshAfterMutation } = useAppMutationRefresh();

  // ── State ───────────────────────────────────────────────────────────────
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod]     = useState<PaymentMethodKey>("cash");
  
  const [productSearch, setProductSearch]         = useState("");
  const debouncedSearch                           = useDebounce(productSearch, SEARCH_DEBOUNCE_MS);
  
  const [cartProductSearch, setCartProductSearch] = useState("");
  const debouncedCartProductSearch                = useDebounce(cartProductSearch, SEARCH_DEBOUNCE_MS);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detachedClient, setDetachedClient]     = useState<Client | null>(null);

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const mountedRef = useRef(true);

  // ── Currency ────────────────────────────────────────────────────────────
  const storeSelected       = useCurrencyStore((s) => s.selectedCurrency);
  const storeRates          = useCurrencyStore((s) => s.rates);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);
  const selectedCurrency: Currency = storeSelected;
  const rates = storeRates;

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Sync detached client if it appears in main list
  useEffect(() => {
    if (!selectedClientId || !detachedClient) return;
    if (clients.some((x) => x.id === selectedClientId)) setDetachedClient(null);
  }, [clients, selectedClientId, detachedClient]);

  // ── Derived State (Memoized) ────────────────────────────────────────────
  
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) ?? 
           (detachedClient?.id === selectedClientId ? detachedClient : null);
  }, [clients, selectedClientId, detachedClient]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    const q = debouncedSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, debouncedSearch]);

  const quickCartProducts = useMemo(() => {
    const q = debouncedCartProductSearch.toLowerCase();
    const base = q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : products;
    return base.slice(0, 6);
  }, [products, debouncedCartProductSearch]);

  const cartQtyMap = useMemo(
    () => new Map(cart.map((i) => [i.product.id, i.quantity])),
    [cart],
  );

  const totals = useMemo(() => {
    const sub   = cart.reduce((acc, i) => acc + i.product.price_gnf * i.quantity, 0);
    const disc  = Math.round(sub * (discountPercent / 100) * 100) / 100;
    const items = cart.reduce((acc, i) => acc + i.quantity, 0);
    return { subtotalGNF: sub, discountAmountGNF: disc, totalGNF: sub - disc, totalItems: items };
  }, [cart, discountPercent]);

  const displays = useMemo(() => {
    const sub = convertGnfWithRates(totals.subtotalGNF, selectedCurrency, rates);
    const disc = convertGnfWithRates(totals.discountAmountGNF, selectedCurrency, rates);
    const tot = convertGnfWithRates(totals.totalGNF, selectedCurrency, rates);
    const ok = (n: number) => Number.isFinite(n);
    return {
      subtotal: ok(sub) ? formatCurrency(sub, selectedCurrency) : "—",
      discount: ok(disc) ? formatCurrency(disc, selectedCurrency) : "—",
      total: ok(tot) ? formatCurrency(tot, selectedCurrency) : "—",
    };
  }, [totals, selectedCurrency, rates]);

  // ── Handlers (Memoized) ─────────────────────────────────────────────────

  const addToCart = useCallback((product: Product) => {
    if (product.stock_quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showSuccess(`${product.name} ajouté au panier`);
  }, [showSuccess]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
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
  }, []);

  const setSelectedClient = useCallback((c: Client | null) => {
    if (!c) {
      setSelectedClientId(null);
      setDetachedClient(null);
      return;
    }
    setSelectedClientId(c.id);
    setDetachedClient(clients.some((x) => x.id === c.id) ? null : c);
  }, [clients]);

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!selectedClient) {
      setSubmitError(ERROR_CODES.CLIENT_REQUIRED);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitSale({
        clientId: selectedClient.id,
        items: cart.map((i) => ({
          productId:      i.product.id,
          productName:    i.product.name,
          productSku:     i.product.sku,
          quantity:       i.quantity,
          unitPriceGNF:   i.product.price_gnf,
          discountPercent: 0,
        })),
        discountPercent,
        paymentMethod,
        displayCurrency: selectedCurrency,
        exchangeRate:
          selectedCurrency === "GNF"
            ? 1
            : (rates[selectedCurrency] ?? FALLBACK_RATES[selectedCurrency] ?? 1),
        notes: null,
      });

      if (!mountedRef.current) return;
      if (result.success) {
        const conv = convertGnfWithRates(result.sale.total_amount_gnf, selectedCurrency, rates);
        setCompletedSale({
          ...result.sale,
          displayTotal: Number.isFinite(conv)
            ? formatCurrency(conv, selectedCurrency)
            : formatCurrency(result.sale.total_amount_gnf, "GNF"),
        });
        setSelectedCurrency("GNF");
        refreshAfterMutation();
      } else {
        logError("SALE_SUBMIT", result.error, { cartSize: cart.length });
        const message = resolveErrorMessage(result.error);
        setSubmitError(message);
        showError(message || "Échec de l’opération");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      logError("SALE_SUBMIT_UNEXPECTED", err, { cartSize: cart.length });
      const message = "Une erreur est survenue";
      setSubmitError(message);
      showError(message);
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  }, [cart, isSubmitting, selectedClient, discountPercent, paymentMethod, selectedCurrency, rates, submitSale, setSelectedCurrency, refreshAfterMutation, showError]);

  const resetForNewSale = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setSelectedClientId(null);
    setDetachedClient(null);
    setPaymentMethod("cash");
    setProductSearch("");
    setSubmitError(null);
    setCompletedSale(null);
    setSelectedCurrency("GNF");
  }, [setSelectedCurrency]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingCart size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-darktext">Nouvelle vente</h1>
              <p className="text-xs text-gray-400">
                {products.length} produit{products.length !== 1 ? "s" : ""} disponible{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/vente/historique"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <History size={15} className="text-gray-500" />
              Historique
            </Link>
            <button
              type="button"
              onClick={() => setCartModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
            >
              <ShoppingCart size={15} />
              Panier{cart.length > 0 ? ` (${totals.totalItems})` : ""}
            </button>
          </div>
        </div>

        {/* Success or Catalog */}
        {completedSale ? (
          <SuccessContent sale={completedSale} onNewSale={resetForNewSale} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher par nom ou SKU…"
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Package size={28} className="text-gray-200" />
                  <p className="text-sm font-medium text-gray-400">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      cartQty={cartQtyMap.get(p.id) ?? 0}
                      onAdd={addToCart}
                      currency={selectedCurrency}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <Modal
        open={!completedSale && cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        title="Panier"
        subtitle="Ajoutez des produits, choisissez le client puis validez"
        icon={<ShoppingCart size={18} />}
        size="full"
        bodyClassName="!overflow-hidden flex min-h-0 flex-col px-4 py-3"
        cardClassName="max-h-[calc(100dvh-1rem)] min-h-0"
      >
        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-0 flex-col gap-2">
            {/* Quick Add */}
            <div className="rounded-xl border border-gray-100 p-2.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ajouter un produit</p>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={cartProductSearch}
                  onChange={(e) => setCartProductSearch(e.target.value)}
                  placeholder="Nom ou SKU…"
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary"
                />
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {quickCartProducts.map((p) => {
                  const qty = cartQtyMap.get(p.id) ?? 0;
                  const disabled = p.stock_quantity <= 0 || qty >= p.stock_quantity;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => addToCart(p)}
                      className="rounded-lg border border-gray-200 px-1.5 py-1 text-left text-[11px] transition hover:bg-primary/5 disabled:opacity-40"
                    >
                      <p className="truncate font-semibold text-darktext">{p.name}</p>
                      <p className="truncate text-[9px] text-gray-400">{p.sku}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-darktext">Articles</h2>
                  {cart.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {totals.totalItems}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={10} className="inline mr-1" /> Vider
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-4 text-center">
                    <ShoppingCart size={18} className="text-gray-300" />
                    <p className="text-xs font-medium text-gray-400">Panier vide</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {cart.map((item) => (
                      <CartRow
                        key={item.product.id}
                        compact
                        item={item}
                        onRemove={removeFromCart}
                        onUpdateQty={updateQuantity}
                        currency={selectedCurrency}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totals & Actions */}
          <div className="flex min-h-0 flex-col gap-0 overflow-hidden">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
              {/* Summary */}
              <div className="space-y-1.5 rounded-xl border border-gray-100 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Sous-total</span>
                  <span className="font-semibold tabular-nums text-darktext">{displays.subtotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs text-gray-400">Remise %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-14 rounded-md border border-gray-200 px-1.5 py-0.5 text-right text-xs outline-none"
                  />
                  {discountPercent > 0 && (
                    <span className="ml-auto text-xs font-semibold text-red-500">−{displays.discount}</span>
                  )}
                </div>
              </div>

              {/* Currency */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Devise</p>
                <div className="grid grid-cols-4 gap-1">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setSelectedCurrency(cur)}
                      className={`rounded-lg border py-1.5 text-[11px] font-bold transition-all ${
                        selectedCurrency === cur
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-primary/30"
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Display */}
              <div className="rounded-xl bg-gradient-to-br from-primary to-primary-light px-3 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total à payer</p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">{displays.total}</p>
                {selectedCurrency !== "GNF" && (
                  <p className="mt-0.5 text-[10px] text-white/50">≈ {formatCurrency(totals.totalGNF, "GNF")}</p>
                )}
              </div>

              {/* Selectors */}
              <div className="min-w-0">
                <ClientSelector
                  clients={clients}
                  selected={selectedClient}
                  onSelect={setSelectedClient}
                />
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mode de paiement</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`rounded-lg border py-2 text-[10px] font-semibold transition-all ${
                        paymentMethod === pm.key
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-primary/30"
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Button */}
            <div className="shrink-0 space-y-2 border-t border-gray-200 bg-white pt-3">
              {submitError && (
                <div className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {submitError}
                </div>
              )}
              <button
                type="button"
                disabled={cart.length === 0 || !selectedClient || isSubmitting}
                onClick={handleSubmit}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-lg transition-all ${
                  cart.length === 0 || !selectedClient
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 shadow-none"
                    : "bg-primary text-white shadow-primary/35 hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Traitement…</>
                ) : cart.length === 0 ? (
                  "Panier vide"
                ) : !selectedClient ? (
                  "Choisir un client"
                ) : (
                  <><CheckCircle size={18} strokeWidth={2.25} /> Valider la vente — {displays.total}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
