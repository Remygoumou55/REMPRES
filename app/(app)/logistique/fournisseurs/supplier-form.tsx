import Link from "next/link";
import type { Supplier } from "@/lib/types/logistique";

type Props = {
  action: (formData: FormData) => void;
  initial?: Partial<Supplier>;
  submitLabel?: string;
  backHref?: string;
};

export function SupplierForm({
  action,
  initial,
  submitLabel = "Enregistrer",
  backHref = "/logistique/fournisseurs",
}: Props) {
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Identification</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Nom du fournisseur <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Contact (personne)</span>
            <input
              name="contact_name"
              defaultValue={initial?.contact_name ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Catégorie</span>
            <input
              name="category"
              defaultValue={initial?.category ?? ""}
              className="input w-full"
              placeholder="ex : Matériel, Consommables…"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Coordonnées</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Email</span>
            <input
              type="email"
              name="email"
              defaultValue={initial?.email ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Téléphone</span>
            <input
              name="phone"
              defaultValue={initial?.phone ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Adresse</span>
            <textarea
              name="address"
              rows={2}
              defaultValue={initial?.address ?? ""}
              className="input w-full"
            />
          </label>
          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Fournisseur actif
            </span>
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
