"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adjustLogisticsStockAction,
  createLogisticsGoodsReceiptAction,
} from "@/modules/logistics/server/actions/logistics-actions";

type Option = { id: string; label: string };

type Props = {
  warehouses: Option[];
  products: Option[];
};

export function LogisticsStockOpsPanel({ warehouses, products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"receipt" | "adjust">("receipt");

  return (
    <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/30 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("receipt")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "receipt" ? "bg-teal-800 text-white" : "bg-white text-gray-700"}`}
        >
          Réception
        </button>
        <button
          type="button"
          onClick={() => setMode("adjust")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "adjust" ? "bg-teal-800 text-white" : "bg-white text-gray-700"}`}
        >
          Ajustement
        </button>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const productId = String(fd.get("productId") ?? "");
            const warehouseId = String(fd.get("warehouseId") ?? "") || undefined;
            const res =
              mode === "receipt"
                ? await createLogisticsGoodsReceiptAction({
                    productId,
                    warehouseId,
                    qtyReceived: Number(fd.get("qty") ?? 1),
                  })
                : await adjustLogisticsStockAction({
                    productId,
                    warehouseId,
                    qtyDelta: Number(fd.get("qty") ?? 0),
                    reason: String(fd.get("reason") ?? "") || undefined,
                  });
            if (!res.success) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <select name="productId" required className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">Article…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
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
        <input
          name="qty"
          type="number"
          required
          placeholder={mode === "receipt" ? "Qté reçue" : "Δ quantité (+/-)"}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        {mode === "adjust" ? (
          <input
            name="reason"
            placeholder="Motif ajustement"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="sm:col-span-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Traitement…" : mode === "receipt" ? "Enregistrer réception" : "Ajuster stock"}
        </button>
        {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
