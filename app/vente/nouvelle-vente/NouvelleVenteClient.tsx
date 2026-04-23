"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  History,
  ChevronDown,
  Loader2,
  Trash2,
  Users,
  Banknote,
  Smartphone,
  Building2,
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

type CartItem      = { product: Product; quantity: number };
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

function formatGNF(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " GNF";
}

// ---------------------------------------------------------------------------
// Toast simple
// ---------------------------------------------------------------------------

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 animate-fadeInUp">
      <div className="flex items-center gap-2.5 rounded-2xl bg-gray-900 px-4 py-3 shadow-2xl">
        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
        <span className="text-sm font-medium text-white">{message}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { key: "cash"          as const, label: "Espèces",      icon: Banknote  },
  { key: "mobile_money"  as const, label: "Mobile Money", icon: Smartphone },
  { key: "bank_transfer" as const, label: "Virement",     icon: Building2 },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];

const CURRENCIES: Currency[] = ["GNF", "XOF", "USD", "EUR"];

// ---------------------------------------------------------------------------
// ProductCard — carte interactive POS
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  cartQty,
  onAdd,
}: {
  product: Product;
  cartQty: number;
  onAdd: (p: Product) => void;
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
            {formatGNF(product.price_gnf)}
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
}

// ---------------------------------------------------------------------------
// CartRow — ligne panier premium
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
  const lineTotal = item.product.price_gnf * item.quantity;
  const atMax = item.quantity >= item.product.stock_quantity;

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
          {formatGNF(item.product.price_gnf)} / unité
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
        <p className="text-sm font-bold tabular-nums text-darktext">{formatGNF(lineTotal)}</p>
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
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const debouncedQuery      = useDebounce(query, 200);

  const filtered = debouncedQuery
    ? clients.filter((c) => getClientLabel(c).toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 8)
    : clients.slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Users size={11} />
        Client
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          selected ? "border-primary/30 bg-primary/5 text-darktext" : "border-gray-200 bg-white text-gray-400"
        }`}
      >
        <span className="truncate">{selected ? getClientLabel(selected) : "Client de passage"}</span>
        <ChevronDown size={14} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto pb-1">
            <li>
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
              >
                <Users size={14} className="shrink-0" />
                Client de passage
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-darktext">{getClientLabel(c)}</span>
                  {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
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
// SuccessModal — modal de confirmation premium
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">

        {/* Icône succès animée */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle size={44} className="text-emerald-500" />
        </div>

        <h2 className="text-2xl font-extrabold text-darktext">Vente enregistrée !</h2>

        {sale.reference && (
          <div className="mt-2 inline-flex items-center rounded-full bg-primary/8 px-3 py-1">
            <span className="font-mono text-sm font-bold text-primary">{sale.reference}</span>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-400">Montant total</p>
          <p className="text-3xl font-extrabold tabular-nums text-darktext">
            {formatGNF(sale.total_amount_gnf)}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={`/vente/recu/${sale.id}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-darktext transition hover:bg-gray-50"
          >
            <Printer size={15} />
            Imprimer le reçu
          </a>
          <button
            type="button"
            onClick={onNewSale}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <RotateCcw size={15} />
            Nouvelle vente
          </button>
          <button
            type="button"
            onClick={() => router.push("/vente/historique")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <History size={15} />
            Voir l&apos;historique
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal — NouvelleVenteClient
// ---------------------------------------------------------------------------

type Props = { products: Product[]; clients: Client[] };

export function NouvelleVenteClient({ products, clients }: Props) {

  // ── Cart ────────────────────────────────────────────────────────────────
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // ── Currency ────────────────────────────────────────────────────────────
  const storeSelected      = useCurrencyStore((s) => s.selectedCurrency);
  const storeRates         = useCurrencyStore((s) => s.rates);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const selectedCurrency: Currency = hydrated ? storeSelected : "GNF";
  const rates = hydrated ? storeRates : FALLBACK_RATES;

  // ── Search ──────────────────────────────────────────────────────────────
  const [productSearch, setProductSearch]  = useState("");
  const debouncedSearch                    = useDebounce(productSearch, 300);

  // ── Client & payment ────────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethodKey>("cash");

  // ── Submit ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [completedSale, setCompletedSale]   = useState<CompletedSale | null>(null);

  // ── Toast ───────────────────────────────────────────────────────────────
  const [toast, setToast]                   = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────

  const filteredProducts = debouncedSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : products;

  const cartQtyMap = new Map(cart.map((i) => [i.product.id, i.quantity]));

  const subtotalGNF       = cart.reduce((acc, i) => acc + i.product.price_gnf * i.quantity, 0);
  const discountAmountGNF = Math.round(subtotalGNF * (discountPercent / 100) * 100) / 100;
  const totalGNF          = subtotalGNF - discountAmountGNF;
  const totalItems        = cart.reduce((acc, i) => acc + i.quantity, 0);

  const displaySubtotal  = formatAmount(convertAmount(subtotalGNF,       selectedCurrency, rates), selectedCurrency);
  const displayDiscount  = formatAmount(convertAmount(discountAmountGNF, selectedCurrency, rates), selectedCurrency);
  const displayTotal     = formatAmount(convertAmount(totalGNF,          selectedCurrency, rates), selectedCurrency);

  // ── Cart operations ─────────────────────────────────────────────────────

  function addToCart(product: Product) {
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
    showToast(`✓ ${product.name} ajouté au panier`);
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

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createSaleAction({
        clientId: selectedClient?.id ?? null,
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

  // ── Success ──────────────────────────────────────────────────────────────

  if (completedSale) {
    return <SuccessModal sale={completedSale} onNewSale={resetForNewSale} />;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast global */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex h-full flex-col gap-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-darktext">Nouvelle vente</h1>
            <p className="text-xs text-gray-400">
              {products.length} produit{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/vente/historique"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <History size={15} />
            Historique
          </Link>
        </div>

        {/* 2-column layout */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start">

          {/* ──────────────────────────────────────────────────────────
              GAUCHE — Catalogue
          ────────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3 lg:flex-1">

            {/* Barre de recherche */}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Grille produits */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Package size={28} className="text-gray-200" />
                  <p className="text-sm font-medium text-gray-400">Aucun produit trouvé</p>
                  <p className="text-xs text-gray-300">Essayez un autre terme de recherche</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      cartQty={cartQtyMap.get(p.id) ?? 0}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────
              DROITE — Panier
          ────────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3 lg:w-[380px] lg:sticky lg:top-4 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

              {/* Cart header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingCart size={15} className="text-primary" />
                  </div>
                  <h2 className="font-bold text-darktext">Panier</h2>
                  {cart.length > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={11} />
                    Vider
                  </button>
                )}
              </div>

              {/* Cart items */}
              <div className={`px-3 py-2 transition-all ${cart.length > 4 ? "max-h-64 overflow-y-auto" : ""}`}>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <ShoppingCart size={22} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Panier vide</p>
                    <p className="text-xs text-gray-300">Cliquez sur un produit pour l&apos;ajouter</p>
                  </div>
                ) : (
                  <div className="space-y-0.5 py-1">
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

              {/* Totaux + options */}
              <div className="border-t border-gray-100 px-4 py-4 space-y-4">

                {/* Sous-total + remise */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Sous-total</span>
                    <span className="font-semibold text-darktext">{displaySubtotal}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="shrink-0 text-sm text-gray-400">Remise %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm font-semibold outline-none focus:border-primary"
                    />
                    {discountPercent > 0 && (
                      <span className="ml-auto text-sm font-semibold text-red-500">−{displayDiscount}</span>
                    )}
                  </div>
                </div>

                {/* Devise */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Devise</p>
                  <div className="flex gap-1.5">
                    {CURRENCIES.map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setSelectedCurrency(cur)}
                        className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all ${
                          selectedCurrency === cur
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TOTAL */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-light px-4 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Total à payer</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">{displayTotal}</p>
                  {selectedCurrency !== "GNF" && (
                    <p className="mt-1 text-xs text-white/50">≈ {formatGNF(totalGNF)}</p>
                  )}
                </div>

                {/* Client */}
                <ClientSelector
                  clients={clients}
                  selected={selectedClient}
                  onSelect={setSelectedClient}
                />

                {/* Mode de paiement */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Mode de paiement</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.key}
                          type="button"
                          onClick={() => setPaymentMethod(pm.key)}
                          className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                            paymentMethod === pm.key
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                          }`}
                        >
                          <Icon size={14} />
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Erreur */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {submitError}
                  </div>
                )}

                {/* Bouton valider */}
                <button
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleSubmit}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold transition-all ${
                    cart.length === 0
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : isSubmitting
                      ? "cursor-wait bg-primary/80 text-white"
                      : "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 active:scale-[.98]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Traitement en cours…
                    </>
                  ) : cart.length === 0 ? (
                    "Panier vide"
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Valider — {displayTotal}
                    </>
                  )}
                </button>

              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
