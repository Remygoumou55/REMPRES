"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { createOrderAction } from "@/app/(app)/logistique/commandes/actions";

type StockItemOption = {
  id: string;
  name: string;
  sku: string | null;
  unit_price_gnf: number;
};

type Line = {
  stock_item_id: string | null;
  product_name: string;
  quantity_ordered: number;
  unit_price_gnf: number;
};

type Props = {
  stockItems: StockItemOption[];
  onSuccess: (orderNumber: string) => void;
  onCancel: () => void;
};

function emptyLine(): Line {
  return {
    stock_item_id: null,
    product_name: "",
    quantity_ordered: 1,
    unit_price_gnf: 0,
  };
}

function formatGNF(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} GNF`;
}

function PurchaseOrderFormInner({ stockItems, onSuccess, onCancel }: Props) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () =>
      lines.reduce(
        (acc, line) => acc + Number(line.quantity_ordered || 0) * Number(line.unit_price_gnf || 0),
        0,
      ),
    [lines],
  );

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function validate(): string | null {
    if (!supplierName.trim()) return "Le nom du fournisseur est obligatoire.";
    if (lines.length === 0) return "Ajoutez au moins un article.";
    for (const line of lines) {
      if (!line.product_name.trim()) return "Chaque ligne doit avoir un nom article.";
      if (Number(line.quantity_ordered) <= 0) return "La quantité doit être supérieure à 0.";
      if (Number(line.unit_price_gnf) < 0) return "Le prix unitaire ne peut pas être négatif.";
    }
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("supplier_name", supplierName.trim());
      formData.set("supplier_contact", supplierContact.trim());
      formData.set("expected_delivery_date", expectedDate);
      formData.set("notes", notes.trim());
      formData.set("items", JSON.stringify(lines));

      const result = await createOrderAction(formData);
      if (!result.success) {
        setError(result.error ?? "Création impossible.");
        return;
      }
      onSuccess(result.order_number ?? "CMD");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500">
            Nom du fournisseur <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Ex: Guinée Fournitures SA"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500">Contact</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            placeholder="Téléphone ou email"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500">Date de livraison prévue</label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-gray-500">Notes</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-darktext">Articles à commander</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50"
            onClick={addLine}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un article
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const lineTotal = Number(line.quantity_ordered || 0) * Number(line.unit_price_gnf || 0);
            return (
              <div key={index} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs text-gray-500">Article</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.stock_item_id ?? ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setLine(index, { stock_item_id: null });
                        return;
                      }
                      const selected = stockItems.find((s) => s.id === id);
                      setLine(index, {
                        stock_item_id: id,
                        product_name: selected?.name ?? "",
                        unit_price_gnf: Number(selected?.unit_price_gnf ?? 0),
                      });
                    }}
                  >
                    <option value="">Autre article</option>
                    {stockItems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sku ? `${s.sku} — ${s.name}` : s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs text-gray-500">Nom article</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.product_name}
                    onChange={(e) => setLine(index, { product_name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.quantity_ordered}
                    onChange={(e) => setLine(index, { quantity_ordered: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Prix unitaire GNF</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.unit_price_gnf}
                    onChange={(e) => setLine(index, { unit_price_gnf: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500">Total</label>
                  <p className="pt-2 text-xs font-semibold tabular-nums">{formatGNF(lineTotal)}</p>
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500"> </label>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => removeLine(index)}
                    aria-label="Supprimer ligne"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Total commande</span>
        <span className="text-base font-bold tabular-nums text-darktext">{formatGNF(total)}</span>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Création..." : "Créer la commande"}
        </button>
      </div>
    </form>
  );
}

export const PurchaseOrderForm = memo(PurchaseOrderFormInner);
