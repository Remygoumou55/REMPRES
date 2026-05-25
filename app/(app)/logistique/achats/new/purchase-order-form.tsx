"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Supplier = { id: string; label: string };

type LineItem = {
  item_name: string;
  quantity: string;
  unit_price_gnf: string;
};

const emptyLine: LineItem = { item_name: "", quantity: "1", unit_price_gnf: "0" };

export function PurchaseOrderForm({
  suppliers,
  action,
}: {
  suppliers: Supplier[];
  action: (formData: FormData) => void;
}) {
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const total = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unit_price_gnf) || 0),
    0,
  );

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Fournisseur</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Fournisseur <span className="text-red-500">*</span>
            </span>
            <select name="supplier_id" required className="input w-full">
              <option value="">— Sélectionner un fournisseur —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Date prévue de livraison
            </span>
            <input type="date" name="expected_date" className="input w-full" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Notes</span>
            <textarea name="notes" rows={2} className="input w-full" />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-darktext">Articles à commander</h2>
          <button
            type="button"
            onClick={addLine}
            className="btn-secondary inline-flex items-center gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 items-end gap-3 border-b border-gray-100 pb-3"
            >
              <label className="col-span-12 space-y-1 md:col-span-6">
                <span className="text-xs font-medium text-gray-600">
                  Article <span className="text-red-500">*</span>
                </span>
                <input
                  name={`item_name_${idx}`}
                  required
                  value={line.item_name}
                  onChange={(e) => updateLine(idx, { item_name: e.target.value })}
                  className="input w-full"
                  placeholder="Nom de l'article"
                />
              </label>
              <label className="col-span-4 space-y-1 md:col-span-2">
                <span className="text-xs font-medium text-gray-600">
                  Quantité <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  name={`quantity_${idx}`}
                  required
                  min={0}
                  step="0.001"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  className="input w-full"
                />
              </label>
              <label className="col-span-6 space-y-1 md:col-span-3">
                <span className="text-xs font-medium text-gray-600">
                  Prix unitaire (GNF) <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  name={`unit_price_${idx}`}
                  required
                  min={0}
                  step={100}
                  value={line.unit_price_gnf}
                  onChange={(e) => updateLine(idx, { unit_price_gnf: e.target.value })}
                  className="input w-full"
                />
              </label>
              <div className="col-span-2 flex items-end justify-end md:col-span-1">
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <input type="hidden" name="lines_count" value={lines.length} />

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-3">
          <span className="text-sm text-gray-600">Total estimé</span>
          <span className="text-lg font-bold text-darktext">
            {Math.round(total).toLocaleString("fr-FR")} GNF
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          Soumettre la commande
        </button>
        <Link href="/logistique/achats" className="btn-secondary">
          Annuler
        </Link>
      </div>
    </form>
  );
}
