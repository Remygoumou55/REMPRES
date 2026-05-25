"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogisticsPurchaseOrderAction } from "@/modules/logistics/server/actions/logistics-actions";

type Option = { id: string; label: string };

type Props = {
  suppliers: Option[];
  warehouses: Option[];
  products: Option[];
};

export function LogisticsPurchaseOrderCreateForm({ suppliers, warehouses, products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createLogisticsPurchaseOrderAction({
            supplierId: String(fd.get("supplierId") ?? ""),
            warehouseId: String(fd.get("warehouseId") ?? "") || undefined,
            productId: String(fd.get("productId") ?? ""),
            qtyOrdered: Number(fd.get("qtyOrdered") ?? 1),
            unitCostGnf: Number(fd.get("unitCostGnf") ?? 0),
            notes: String(fd.get("notes") ?? "") || undefined,
          });
          if (!res.success) {
            setError(res.error);
            return;
          }
          e.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <p className="sm:col-span-2 text-sm font-medium text-slate-900">Nouvelle commande (brouillon)</p>
      <select name="supplierId" required className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
        <option value="">Fournisseur…</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <select name="warehouseId" className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
        <option value="">Entrepôt défaut</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
      <select name="productId" required className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
        <option value="">Article…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        name="qtyOrdered"
        type="number"
        min={1}
        defaultValue={1}
        required
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="unitCostGnf"
        type="number"
        min={0}
        step="0.01"
        placeholder="Coût unitaire GNF"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="notes"
        placeholder="Notes"
        className="sm:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer la commande"}
      </button>
      {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
