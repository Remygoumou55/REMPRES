"use client";

import Link from "next/link";
import { useState } from "react";
import type { MovementType } from "@/lib/types/logistique";

type Props = {
  items: { id: string; label: string; unit: string; quantity: number }[];
  warehouses: { id: string; label: string; code: string }[];
  defaultItemId?: string;
  action: (formData: FormData) => void;
};

export function MovementForm({ items, warehouses, defaultItemId, action }: Props) {
  const [type, setType] = useState<MovementType>("in");

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Mouvement</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Article <span className="text-red-500">*</span>
            </span>
            <select
              name="item_id"
              required
              defaultValue={defaultItemId ?? ""}
              className="input w-full"
            >
              <option value="">— Sélectionner un article —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.label} (stock : {it.quantity} {it.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Type <span className="text-red-500">*</span>
            </span>
            <select
              name="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value as MovementType)}
              className="input w-full"
            >
              <option value="in">Entrée</option>
              <option value="out">Sortie</option>
              <option value="adjust">Ajustement (nouvelle quantité)</option>
              <option value="transfer">Transfert</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Quantité <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              name="quantity"
              required
              min={0}
              step="0.001"
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Référence</span>
            <input
              name="reference"
              className="input w-full"
              placeholder="Bon de livraison, facture, etc."
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Motif</span>
            <textarea
              name="reason"
              rows={2}
              className="input w-full"
              placeholder="Description du mouvement"
            />
          </label>
        </div>
      </section>

      {type === "transfer" ? (
        <section className="card space-y-4 p-6">
          <h2 className="text-base font-semibold text-darktext">Transfert entre entrepôts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Entrepôt source <span className="text-red-500">*</span>
              </span>
              <select
                name="warehouse_from"
                required={type === "transfer"}
                className="input w-full"
              >
                <option value="">— Sélectionner —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} ({w.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-600">
                Entrepôt destination <span className="text-red-500">*</span>
              </span>
              <select
                name="warehouse_to"
                required={type === "transfer"}
                className="input w-full"
              >
                <option value="">— Sélectionner —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} ({w.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          Enregistrer le mouvement
        </button>
        <Link href="/logistique/mouvements" className="btn-secondary">
          Annuler
        </Link>
      </div>
    </form>
  );
}
