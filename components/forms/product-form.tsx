"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useCloseModalNavigation } from "@/lib/hooks/use-close-modal-navigation";
import { Package, Tag, Layers, DollarSign, Archive, AlertTriangle, FileText, Save, Plus } from "lucide-react";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalTextarea,
  ModalSelect,
  ModalError,
  ModalActions,
} from "@/components/ui/modal";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/currency";
import { convertCurrency } from "@/lib/services/currencyService";
import { MarginBadge } from "@/components/products/MarginBadge";
import {
  computeMargin,
  getMarginLevel,
  MARGIN_BG,
} from "@/lib/utils/margin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductFormValues = {
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  unit?: string | null;
  price_gnf?: number | null;
  cost_price_gnf?: number | null;
  stock_quantity?: number | null;
  stock_threshold?: number | null;
};

const UNIT_OPTIONS = ["Unité", "Kg", "Litre", "Carton", "Paquet"] as const;

function formatGNFInput(value: number): string {
  return Math.max(0, Number.isFinite(value) ? value : 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseGNFInput(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, "");
  const parsed = Number(digitsOnly || "0");
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, parsed);
}

type ProductFormProps = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ProductFormValues;
  successMessage?: string;
  errorMessage?: string;
  /**
   * ID produit existant. Si fourni, le widget d'image autorise l'upload réel
   * vers Supabase Storage et persiste image_url via updateProductImageAction.
   * Si absent (création), le widget reste désactivé avec un message.
   */
  productId?: string | null;
};

// ---------------------------------------------------------------------------
// ProductForm — rendu sous forme de Modal
// ---------------------------------------------------------------------------

export function ProductForm({
  title,
  submitLabel,
  action,
  initialValues,
  errorMessage,
  productId,
}: ProductFormProps) {
  const { currency } = useCurrency();
  const closeModal = useCloseModalNavigation();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.image_url ?? null);
  const [priceValue, setPriceValue] = useState<number>(
    Math.max(0, initialValues?.price_gnf ?? 0),
  );
  const [costPriceValue, setCostPriceValue] = useState<number>(
    Math.max(0, initialValues?.cost_price_gnf ?? 0),
  );
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const conversionUnavailable = currency !== "GNF" && priceValue > 0 && !conversionLoading && convertedPrice === null;

  const formattedPrice = useMemo(() => formatGNFInput(priceValue), [priceValue]);
  const formattedCostPrice = useMemo(
    () => (costPriceValue > 0 ? formatGNFInput(costPriceValue) : ""),
    [costPriceValue],
  );
  const liveMargin = useMemo(
    () =>
      computeMargin(
        priceValue > 0 ? priceValue : null,
        costPriceValue > 0 ? costPriceValue : null,
      ),
    [priceValue, costPriceValue],
  );
  const liveMarginLevel = getMarginLevel(liveMargin);
  const showMarginPreview = priceValue > 0 && costPriceValue > 0;
  useEffect(() => {
    let mounted = true;
    if (currency === "GNF" || priceValue <= 0) {
      setConvertedPrice(priceValue);
      setConversionLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timer = window.setTimeout(async () => {
      setConversionLoading(true);
      try {
        const result = await convertCurrency({
          amount: priceValue,
          from: "GNF",
          to: currency,
        });
        if (mounted) setConvertedPrice(result);
      } catch {
        if (mounted) setConvertedPrice(null);
      } finally {
        if (mounted) setConversionLoading(false);
      }
    }, 180);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [currency, priceValue]);
  const defaultUnit = initialValues?.unit && initialValues.unit.trim().length > 0
    ? initialValues.unit
    : "Unité";

  function handleCancel() {
    closeModal();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (conversionUnavailable) {
      setError("Conversion indisponible. Veuillez réessayer dans quelques instants.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(
          err instanceof Error && err.message && !err.message.includes("NEXT_")
            ? err.message
            : "Impossible d'enregistrer le produit. Vérifiez les champs obligatoires et réessayez.",
        );
      }
    });
  }

  return (
    <Modal
      open
      onClose={handleCancel}
      title={title}
      subtitle="Catalogue produits"
      icon={<Package size={18} />}
      size="lg"
      cardClassName="max-h-[90vh] max-w-[min(500px,calc(100vw-2rem))]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Identification</p>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="SKU" required>
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                autoFocus
                name="sku"
                required
                defaultValue={initialValues?.sku ?? ""}
                placeholder="PROD-001"
                className="pl-8"
              />
            </div>
          </ModalField>
          <ModalField label="Unité" required>
            <div className="relative">
              <Layers size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalSelect
                name="unit"
                required
                defaultValue={defaultUnit}
                className="pl-8"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </ModalSelect>
            </div>
          </ModalField>
        </div>

        {/* Nom */}
        <ModalField label="Nom du produit" required>
          <ModalInput
            name="name"
            required
            defaultValue={initialValues?.name ?? ""}
            placeholder="Nom complet du produit"
          />
        </ModalField>

        {/* Description */}
        <ModalField label="Description (facultatif)">
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-gray-400" />
            <ModalTextarea
              name="description"
              rows={2}
              defaultValue={initialValues?.description ?? ""}
              placeholder="Description courte…"
              className="pl-8"
            />
          </div>
        </ModalField>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tarification & stocks</p>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Prix (GNF)" required>
            <div className="relative">
              <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                type="text"
                inputMode="numeric"
                required
                value={formattedPrice}
                onChange={(e) => setPriceValue(parseGNFInput(e.target.value))}
                placeholder="0"
                className="pl-8 pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                GNF
              </span>
              <input type="hidden" name="price_gnf" value={String(priceValue)} />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {currency === "GNF" ? (
                "Valeur en devise de base (GNF)."
              ) : conversionLoading ? (
                "Conversion en cours..."
              ) : convertedPrice === null ? (
                "Conversion indisponible"
              ) : (
                `${formatCurrency(convertedPrice, currency)} ≈ ${formatCurrency(priceValue, "GNF")}`
              )}
            </p>
          </ModalField>
          <ModalField label="Prix d'achat (GNF)">
            <p className="-mt-0.5 mb-1 text-[11px] text-gray-400">
              (optionnel — pour calcul de marge)
            </p>
            <div className="relative">
              <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                type="text"
                inputMode="numeric"
                value={formattedCostPrice}
                onChange={(e) => setCostPriceValue(parseGNFInput(e.target.value))}
                placeholder="Ex: 1 500 000"
                className="pl-8 pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                GNF
              </span>
              <input
                type="hidden"
                name="cost_price_gnf"
                value={costPriceValue > 0 ? String(costPriceValue) : ""}
              />
            </div>
          </ModalField>
          <ModalField label="Stock initial" required>
            <div className="relative">
              <Archive size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="stock_quantity"
                type="number"
                min={0}
                required
                defaultValue={String(initialValues?.stock_quantity ?? 0)}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </ModalField>
        </div>

        <div
          className="rounded-xl px-3 py-2.5 text-sm"
          style={{
            background: showMarginPreview
              ? liveMarginLevel
                ? MARGIN_BG[liveMarginLevel]
                : "#f3f4f6"
              : "#f9fafb",
          }}
        >
          {showMarginPreview ? (
            <p className="flex flex-wrap items-center gap-2 text-gray-700">
              <span className="text-xs font-medium">Marge calculée :</span>
              <MarginBadge marginPct={liveMargin} />
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Renseignez le prix de vente et le prix d&apos;achat pour prévisualiser la marge.
            </p>
          )}
        </div>

        {/* Seuil stock + Image upload */}
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Seuil stock bas" required>
            <div className="relative">
              <AlertTriangle size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="stock_threshold"
                type="number"
                min={0}
                required
                defaultValue={String(initialValues?.stock_threshold ?? 5)}
                placeholder="5"
                className="pl-8"
              />
            </div>
          </ModalField>
          <div>
            <ProductImageUpload
              currentImageUrl={imageUrl}
              productId={productId ?? null}
              onChange={setImageUrl}
            />
            <input type="hidden" name="image_url" value={imageUrl ?? ""} />
          </div>
        </div>

        </div>

        <ModalError message={error} />

        <ModalActions
          onCancel={handleCancel}
          submitLabel={submitLabel}
          loading={pending || conversionLoading}
          submitDisabled={conversionUnavailable}
          submitIcon={initialValues ? <Save size={14} /> : <Plus size={14} />}
        />
      </form>
    </Modal>
  );
}
