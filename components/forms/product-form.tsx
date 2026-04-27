"use client";

import Link from "next/link";
import Image from "next/image";
import { FlashMessage } from "@/components/ui/flash-message";
import { useState } from "react";

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

type ProductFormProps = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ProductFormValues;
  cancelHref?: string;
  successMessage?: string;
  errorMessage?: string;
};

export function ProductForm({
  title,
  submitLabel,
  action,
  initialValues,
  cancelHref = "/vente/produits",
  successMessage,
  errorMessage,
}: ProductFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(
    initialValues?.image_url ?? ""
  );

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-darktext">{title}</h1>

      <div className="mt-4">
        <FlashMessage success={successMessage} error={errorMessage} />
      </div>

      <form action={action} className="mt-6 space-y-4">
        {/* SKU + UNIT */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              SKU
            </label>
            <input
              name="sku"
              defaultValue={initialValues?.sku ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              Unité
            </label>
            <input
              name="unit"
              defaultValue={initialValues?.unit ?? "unite"}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
        </div>

        {/* NAME */}
        <div>
          <label className="mb-1 block text-sm font-medium text-darktext">
            Nom du produit
          </label>
          <input
            name="name"
            defaultValue={initialValues?.name ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="mb-1 block text-sm font-medium text-darktext">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={initialValues?.description ?? ""}
            className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {/* PRICE + STOCK */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              Prix (GNF)
            </label>
            <input
              name="price_gnf"
              type="number"
              step="0.01"
              defaultValue={String(initialValues?.price_gnf ?? 0)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              min={0}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              Stock
            </label>
            <input
              name="stock_quantity"
              type="number"
              defaultValue={String(initialValues?.stock_quantity ?? 0)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              min={0}
              required
            />
          </div>
        </div>

        {/* THRESHOLD + IMAGE */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              Seuil stock bas
            </label>
            <input
              name="stock_threshold"
              type="number"
              defaultValue={String(initialValues?.stock_threshold ?? 5)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              min={0}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-darktext">
              Image (URL)
            </label>
            <input
              name="image_url"
              defaultValue={initialValues?.image_url ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* IMAGE PREVIEW */}
        {previewUrl && (
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-xs font-medium uppercase text-darktext/70">
              Aperçu
            </p>
            <Image
              src={previewUrl}
              alt="Aperçu produit"
              width={200}
              height={200}
              unoptimized
              className="mt-2 max-h-52 w-auto rounded-md object-contain"
            />
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
            {submitLabel}
          </button>

          <Link
            href={cancelHref}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}