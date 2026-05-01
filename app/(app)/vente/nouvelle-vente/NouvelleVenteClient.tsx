"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
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
  Loader2,
  Trash2,
  Users,
  Banknote,
  Smartphone,
  Building2,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { Product } from "@/types/product";
import { logError } from "@/lib/logger";
import type { Client } from "@/types/client";
import { useCurrencyStore } from "@/stores/currencyStore";
import { FALLBACK_RATES, type Currency } from "@/lib/currencyService";
import { createQuickClientAction } from "./actions";
import { resolveErrorMessage, ERROR_CODES } from "@/lib/messages";
import { formatCurrency } from "@/utils/currency";
import { useSales } from "@/hooks/useSales";
import { useCurrencyBatchConversion, useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalError,
} from "@/components/ui/modal";
import { useToast } from "@/components/providers/ToastProvider";

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type CartItem      = { product: Product; quantity: number };
type CompletedSale = {
  id: string;
  reference: string | null;
  total_amount_gnf: number;
  /** Montant formaté dans la devise choisie lors de la validation */
  displayTotal: string;
};

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

// ---------------------------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { key: "cash"          as const, label: "Espèces",       icon: Banknote  },
  { key: "mobile_money"  as const, label: "Mobile Money", icon: Smartphone },
  { key: "orange_money"  as const, label: "Orange Money", icon: Wallet },
  { key: "bank_transfer" as const, label: "Virement",      icon: Building2 },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];

const CURRENCIES: Currency[] = ["GNF", "XOF", "USD", "EUR"];

// ---------------------------------------------------------------------------
// ProductCard — carte interactive POS
// ---------------------------------------------------------------------------

const ProductCard = memo(function ProductCard({
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

// ---------------------------------------------------------------------------
// CartRow — ligne panier premium
// ---------------------------------------------------------------------------

const CartRow = memo(function CartRow({
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

function PriceText({ amount, currency }: { amount: number; currency: Currency }) {
  const { converted } = useCurrencyConversion({ amount, from: "GNF", to: currency });
  if (converted === null) return <>Conversion indisponible</>;
  return <>{formatCurrency(converted, currency)}</>;
}

// ---------------------------------------------------------------------------
// QuickClientModal — modal création rapide de client (z-[500] au-dessus POS)
// ---------------------------------------------------------------------------

type QuickClientForm = {
  clientType: "individual" | "company";
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

const EMPTY_FORM: QuickClientForm = {
  clientType: "individual",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

function QuickClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [form, setForm]     = useState<QuickClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function set(key: keyof QuickClientForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createQuickClientAction({
        clientType:  form.clientType,
        firstName:   form.firstName,
        lastName:    form.lastName,
        companyName: form.companyName,
        phone:       form.phone,
        email:       form.email || null,
        address:     form.address || null,
        city:        form.city || null,
      });

      if (!mountedRef.current) return;
      setSaving(false);

      if (result.success) {
        setForm(EMPTY_FORM);
        onCreated(result.client);
      } else {
        setError(result.error);
      }
    } catch {
      if (!mountedRef.current) return;
      setSaving(false);
      setError("Impossible de créer le client pour le moment.");
    }
  }

  const isIndividual = form.clientType === "individual";

  // Le Modal partagé est à z-[300]. Pour être au-dessus du POS (z-[400])
  // on utilise un portal custom à z-[500].
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Carte */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">

        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-darktext">Nouveau client</h2>
            <p className="mt-0.5 text-xs text-gray-400">Créer et sélectionner automatiquement</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Type client */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Type de client</p>
            <div className="grid grid-cols-2 gap-2">
              {(["individual", "company"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("clientType", t)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    form.clientType === t
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {t === "individual" ? <Users size={14} /> : <Building2 size={14} />}
                  {t === "individual" ? "Particulier" : "Entreprise"}
                </button>
              ))}
            </div>
          </div>

          {/* Identité */}
          {isIndividual ? (
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Prénom" required>
                <ModalInput
                  autoFocus
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Malin"
                />
              </ModalField>
              <ModalField label="Nom">
                <ModalInput
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Loua"
                />
              </ModalField>
            </div>
          ) : (
            <ModalField label="Nom entreprise" required>
              <ModalInput
                autoFocus
                required
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Nom de l'entreprise"
              />
            </ModalField>
          )}

          {/* Téléphone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Téléphone" required>
                <ModalInput
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="623 00 00 00"
                />
              </ModalField>
              <ModalField label="Email">
                <ModalInput
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@exemple.com"
                />
              </ModalField>
          </div>

          {/* Adresse + Ville */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Adresse">
                <ModalInput
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Quartier, rue…"
                />
              </ModalField>
            <ModalField label="Ville">
              <ModalInput
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Conakry"
              />
            </ModalField>
          </div>

          {/* Erreur */}
          <ModalError message={error} />

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Création…</>
              ) : (
                <><UserPlus size={14} /> Créer et sélectionner</>
              )}
            </button>
          </div>

        </form>
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
  const [query, setQuery]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const debouncedQuery            = useDebounce(query, 200);

  const q = debouncedQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = q
      ? clients.filter((c) => getClientLabel(c).toLowerCase().includes(q))
      : clients;
    return list.slice(0, 400);
  }, [clients, q]);

  function handleCreated(client: Client) {
    onSelect(client);
    setShowModal(false);
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Users size={11} />
            Client <span className="text-red-500">*</span>
          </label>
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="shrink-0 text-[10px] font-semibold text-gray-400 underline-offset-2 hover:text-primary hover:underline"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Bouton visible : ouvre le même popup formulaire qu’avant */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.06] px-3 py-2.5 text-sm font-bold text-primary shadow-sm transition hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <UserPlus size={16} strokeWidth={2.25} />
          Nouveau client
        </button>

        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer la liste…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            aria-label="Filtrer les clients"
          />
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Clients enregistrés — faire défiler horizontalement
          </p>
          <div
            className="max-w-full overflow-x-scroll overflow-y-hidden rounded-xl border border-gray-100 bg-gray-50/80 py-2 pl-2 pr-1 [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200"
            role="listbox"
            aria-label="Liste des clients"
          >
            <div className="flex w-max min-w-full flex-nowrap gap-2 pb-0.5">
              {filtered.map((c) => {
                const isSel = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    title={isSel ? "Cliquer pour retirer la sélection" : undefined}
                    onClick={() => onSelect(isSel ? null : c)}
                    className={`flex max-w-[11rem] shrink-0 flex-col items-start rounded-xl border px-2.5 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isSel
                        ? "border-primary bg-primary text-white shadow-md ring-1 ring-primary/20"
                        : "border-gray-200 bg-white text-darktext hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className={`line-clamp-2 font-semibold ${isSel ? "text-white" : "text-darktext"}`}>
                      {getClientLabel(c)}
                    </span>
                    {c.phone ? (
                      <span className={`mt-0.5 truncate font-mono text-[10px] ${isSel ? "text-white/85" : "text-gray-500"}`}>
                        {c.phone}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-xs text-gray-400">Aucun client ne correspond.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickClientModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// SuccessContent — écran de succès affiché DANS le panel POS
// ---------------------------------------------------------------------------

function SuccessContent({
  sale,
  onNewSale,
}: {
  sale: CompletedSale;
  onNewSale: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
      <div className="w-full max-w-sm text-center">

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
            {sale.displayTotal}
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
// Composant principal — NouvelleVenteClient (modal POS plein-écran)
// ---------------------------------------------------------------------------

type Props = { products: Product[]; clients: Client[] };

export function NouvelleVenteClient({ products, clients }: Props) {
  const { submitSale } = useSales();
  const { showSuccess, showError } = useToast();

  // ── Cart ────────────────────────────────────────────────────────────────
  const [cart, setCart]                       = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // ── Currency ────────────────────────────────────────────────────────────
  const storeSelected       = useCurrencyStore((s) => s.selectedCurrency);
  const storeRates          = useCurrencyStore((s) => s.rates);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const selectedCurrency: Currency = hydrated ? storeSelected : "GNF";
  const rates = hydrated ? storeRates : FALLBACK_RATES;

  // ── Search ──────────────────────────────────────────────────────────────
  const [productSearch, setProductSearch]  = useState("");
  const debouncedSearch                    = useDebounce(productSearch, 300);
  const [cartProductSearch, setCartProductSearch] = useState("");
  const debouncedCartProductSearch = useDebounce(cartProductSearch, 200);

  // ── Client & payment ────────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethodKey>("cash");

  // ── Submit ──────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Derived (mémoïsés pour éviter les recalculs inutiles) ────────────

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    const q = debouncedSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, debouncedSearch]);

  const quickCartProducts = useMemo(() => {
    const base = debouncedCartProductSearch
      ? products.filter((p) =>
          p.name.toLowerCase().includes(debouncedCartProductSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(debouncedCartProductSearch.toLowerCase()),
        )
      : products;
    return base.slice(0, 6);
  }, [products, debouncedCartProductSearch]);

  const cartQtyMap = useMemo(
    () => new Map(cart.map((i) => [i.product.id, i.quantity])),
    [cart],
  );

  const { subtotalGNF, discountAmountGNF, totalGNF, totalItems } = useMemo(() => {
    const sub   = cart.reduce((acc, i) => acc + i.product.price_gnf * i.quantity, 0);
    const disc  = Math.round(sub * (discountPercent / 100) * 100) / 100;
    const items = cart.reduce((acc, i) => acc + i.quantity, 0);
    return { subtotalGNF: sub, discountAmountGNF: disc, totalGNF: sub - disc, totalItems: items };
  }, [cart, discountPercent]);

  const {
    convertedByKey: totalsConverted,
    loading: totalsLoading,
    hasUnavailable: totalsUnavailable,
  } = useCurrencyBatchConversion(
    [
      { key: "subtotal", amount: subtotalGNF },
      { key: "discount", amount: discountAmountGNF },
      { key: "total", amount: totalGNF },
    ],
    "GNF",
    selectedCurrency,
  );
  const subtotalValue = totalsConverted["subtotal"];
  const discountValue = totalsConverted["discount"];
  const totalValue = totalsConverted["total"];
  const displaySubtotal = subtotalValue === null ? "Conversion indisponible" : formatCurrency(subtotalValue ?? 0, selectedCurrency);
  const displayDiscount = discountValue === null ? "Conversion indisponible" : formatCurrency(discountValue ?? 0, selectedCurrency);
  const displayTotal = totalValue === null ? "Conversion indisponible" : formatCurrency(totalValue ?? 0, selectedCurrency);

  // ── Cart operations ─────────────────────────────────────────────────

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
    showSuccess(`${product.name} ajoute au panier`);
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

  // ── Submit ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0 || isSubmitting) return;
    if (totalsUnavailable) {
      setSubmitError("Conversion indisponible. Réessayez avant de valider la vente.");
      return;
    }
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
        exchangeRate: selectedCurrency === "GNF" ? 1 : (rates[selectedCurrency] ?? 1),
        notes: null,
      });

      if (!mountedRef.current) return;
      if (result.success) {
        const saleCurrency = selectedCurrency;
        const saleRates    = rates;
        const completedTotal = totalsConverted["total"];
        setCompletedSale({
          ...result.sale,
          displayTotal:
            completedTotal === null
              ? "Conversion indisponible"
              : formatCurrency(completedTotal ?? result.sale.total_amount_gnf, saleCurrency),
        });
        // Prochaine vente : affichage catalogue / panier en franc guinéen par défaut
        setSelectedCurrency("GNF");
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
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
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
    setSelectedCurrency("GNF");
  }

  // ── Render — page normale ────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* ── En-tête de page ─────────────────────────────────────────────── */}
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
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/vente/historique"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <History size={15} className="shrink-0 text-gray-500" />
              Historique
            </Link>
            <button
              type="button"
              onClick={() => setCartModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
            >
              <ShoppingCart size={15} className="shrink-0" />
              Panier{cart.length > 0 ? ` (${totalItems})` : ""}
            </button>
          </div>
        </div>

        {/* ── Corps : succès OU POS ───────────────────────────────────────── */}
        {completedSale ? (
          <SuccessContent sale={completedSale} onNewSale={resetForNewSale} />
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── GAUCHE — Catalogue ────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-3">

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

        </div>
        )}

      </div>

      {/* Panier en modal pro */}
      <Modal
        open={!completedSale && cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        title="Panier"
        subtitle="Ajoutez des produits, choisissez le client puis validez"
        icon={<ShoppingCart size={18} />}
        size="full"
        overlayClassName="p-2 sm:p-3"
        headerClassName="px-4 py-3"
        bodyClassName="!overflow-hidden flex min-h-0 flex-col px-4 py-3"
        cardClassName="max-h-[calc(100dvh-1rem)] min-h-0"
      >
        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-0 flex-col gap-2">
            {/* Ajout rapide de produit dans le panier */}
            <div className="rounded-xl border border-gray-100 p-2.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ajouter un produit</p>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={cartProductSearch}
                  onChange={(e) => setCartProductSearch(e.target.value)}
                  placeholder="Nom ou SKU…"
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs outline-none transition focus:border-primary"
                />
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {quickCartProducts.map((p) => {
                  const disabled = p.stock_quantity <= 0 || (cartQtyMap.get(p.id) ?? 0) >= p.stock_quantity;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => addToCart(p)}
                      className="rounded-lg border border-gray-200 px-1.5 py-1 text-left text-[11px] transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <p className="truncate font-semibold text-darktext">{p.name}</p>
                      <p className="truncate text-[9px] text-gray-400">{p.sku}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart header + items */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-darktext">Articles</h2>
                  {cart.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {totalItems}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={10} />
                    Vider
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1.5 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

          <div className="flex min-h-0 flex-col gap-0 overflow-hidden">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-0.5 [scrollbar-width:thin]">
            {/* Sous-total + remise */}
            <div className="space-y-1.5 rounded-xl border border-gray-100 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Sous-total</span>
                <span className="font-semibold tabular-nums text-darktext">{displaySubtotal}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs text-gray-400">Remise %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-14 rounded-md border border-gray-200 px-1.5 py-0.5 text-right text-xs font-semibold outline-none focus:border-primary"
                />
                {discountPercent > 0 && (
                  <span className="ml-auto text-xs font-semibold text-red-500">−{displayDiscount}</span>
                )}
              </div>
            </div>

            {/* Devise */}
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
                        : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* TOTAL */}
            <div className="rounded-xl bg-gradient-to-br from-primary to-primary-light px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total à payer</p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">{displayTotal}</p>
              {totalsLoading ? <p className="mt-0.5 text-[10px] text-white/60">Conversion en cours...</p> : null}
              {selectedCurrency !== "GNF" && (
                <p className="mt-0.5 text-[10px] text-white/50">≈ {formatCurrency(totalGNF, "GNF")}</p>
              )}
            </div>

            {/* Client + nouveau client */}
            <div className="min-w-0">
              <ClientSelector
                clients={clients}
                selected={selectedClient}
                onSelect={setSelectedClient}
              />
            </div>

            {/* Mode de paiement */}
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key)}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border py-2 text-[10px] font-semibold leading-tight transition-all ${
                        paymentMethod === pm.key
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      <Icon size={12} />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>

            {/* Pied fixe : erreur + valider toujours entièrement visibles */}
            <div className="shrink-0 space-y-2 border-t border-gray-200 bg-white pt-3 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.08)]">
              {submitError && (
                <div className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {submitError}
                </div>
              )}
              {totalsUnavailable && !submitError && (
                <div className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  Conversion indisponible
                </div>
              )}
              <button
                type="button"
                disabled={cart.length === 0 || !selectedClient || isSubmitting || totalsUnavailable}
                onClick={handleSubmit}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  cart.length === 0 || !selectedClient || totalsUnavailable
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 shadow-none"
                    : isSubmitting
                    ? "cursor-wait bg-primary/85 text-white shadow-primary/20"
                    : "bg-primary text-white shadow-primary/35 ring-2 ring-primary/30 hover:bg-primary/90 hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Traitement…
                  </>
                ) : cart.length === 0 ? (
                  "Panier vide"
                ) : !selectedClient ? (
                  "Choisir un client"
                ) : totalsUnavailable ? (
                  "Conversion indisponible"
                ) : (
                  <>
                    <CheckCircle size={18} strokeWidth={2.25} />
                    Valider la vente — {displayTotal}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
