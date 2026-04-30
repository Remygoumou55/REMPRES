"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Package, Tag, Layers, DollarSign, Archive, AlertTriangle, FileText, Image as ImageIcon, Save, Plus, Upload } from "lucide-react";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalTextarea,
  ModalSelect,
  ModalError,
  ModalActions,
} from "@/components/ui/modal";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/currency";

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
  cancelHref?: string;
  successMessage?: string;
  errorMessage?: string;
};

// ---------------------------------------------------------------------------
// ProductForm — rendu sous forme de Modal
// ---------------------------------------------------------------------------

export function ProductForm({
  title,
  submitLabel,
  action,
  initialValues,
  cancelHref = "/vente/produits",
  errorMessage,
}: ProductFormProps) {
  const { currency, convert } = useCurrency();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const initialPreviewUrl = initialValues?.image_url ?? "";
  const [priceValue, setPriceValue] = useState<number>(
    Math.max(0, initialValues?.price_gnf ?? 0),
  );

  useEffect(() => {
    if (!selectedImageFile) {
      setFilePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedImageFile);
    setFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImageFile]);

  const previewUrl = filePreviewUrl || initialPreviewUrl;
  const formattedPrice = useMemo(() => formatGNFInput(priceValue), [priceValue]);
  const convertedPrice = useMemo(() => {
    try {
      return convert(priceValue, "GNF", currency);
    } catch {
      return priceValue;
    }
  }, [convert, currency, priceValue]);
  const defaultUnit = initialValues?.unit && initialValues.unit.trim().length > 0
    ? initialValues.unit
    : "Unité";

  function handleCancel() {
    router.push(cancelHref);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SKU + Unité */}
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
        <ModalField label="Description">
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

        {/* Prix + Stock */}
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
              {currency === "GNF"
                ? "Valeur enregistrée en devise de base (GNF)."
                : `${formatCurrency(convertedPrice, currency)} ≈ ${formatCurrency(priceValue, "GNF")}`}
            </p>
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
          <ModalField label="Image du produit">
            <div className="relative">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-500 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                <Upload size={14} />
                {selectedImageFile ? selectedImageFile.name : "Ajouter une image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedImageFile(file);
                  }}
                />
              </label>
              {/* Compat backend: on conserve l'URL existante jusqu'à la future implémentation upload */}
              <input type="hidden" name="image_url" value={initialValues?.image_url ?? ""} />
            </div>
          </ModalField>
        </div>

        {/* Aperçu image */}
        {previewUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Image
              src={previewUrl}
              alt="Aperçu"
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-lg object-contain"
            />
            <p className="text-xs text-gray-400">Aperçu de l&apos;image</p>
          </div>
        )}

        <ModalError message={error} />

        <ModalActions
          onCancel={handleCancel}
          submitLabel={submitLabel}
          loading={pending}
          submitIcon={initialValues ? <Save size={14} /> : <Plus size={14} />}
        />
      </form>
    </Modal>
  );
}
