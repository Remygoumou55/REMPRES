import Link from "next/link";
import type { StockItem } from "@/lib/types/logistique";

type Warehouse = { id: string; label: string; code: string };

type Props = {
  action: (formData: FormData) => void;
  warehouses: Warehouse[];
  initial?: Partial<StockItem>;
  submitLabel?: string;
  backHref?: string;
};

export function StockItemForm({
  action,
  warehouses,
  initial,
  submitLabel = "Enregistrer",
  backHref = "/logistique/articles",
}: Props) {
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Identification</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Nom de l&apos;article <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">SKU</span>
            <input
              name="sku"
              defaultValue={initial?.sku ?? ""}
              className="input w-full"
              placeholder="Optionnel"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Catégorie</span>
            <input
              name="category"
              defaultValue={initial?.category ?? ""}
              className="input w-full"
              placeholder="ex : Fournitures, Matières premières…"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={initial?.description ?? ""}
              className="input w-full"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Stock</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Unité <span className="text-red-500">*</span>
            </span>
            <input
              name="unit"
              required
              defaultValue={initial?.unit ?? "piece"}
              className="input w-full"
              placeholder="ex : pièce, kg, litre, carton"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Quantité <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              name="quantity"
              min={0}
              step="0.001"
              required
              defaultValue={initial?.quantity ?? 0}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Seuil min <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              name="min_quantity"
              min={0}
              step="0.001"
              required
              defaultValue={initial?.min_quantity ?? 0}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Prix unitaire (GNF)</span>
            <input
              type="number"
              name="unit_price_gnf"
              min={0}
              step={100}
              defaultValue={initial?.unit_price_gnf ?? 0}
              className="input w-full"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Entrepôt</span>
            <select
              name="warehouse_id"
              defaultValue={initial?.warehouse_id ?? ""}
              className="input w-full"
            >
              <option value="">— Non assigné —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.code})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        <Link href={backHref} className="btn-secondary">
          Annuler
        </Link>
      </div>
    </form>
  );
}
