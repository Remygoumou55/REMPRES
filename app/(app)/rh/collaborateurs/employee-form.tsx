import Link from "next/link";
import type { Employee } from "@/lib/types/rh";

type Props = {
  action: (formData: FormData) => void;
  initial?: Partial<Employee>;
  submitLabel?: string;
  backHref?: string;
};

export function EmployeeForm({ action, initial, submitLabel = "Enregistrer", backHref = "/rh/collaborateurs" }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">
          Informations personnelles
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Prénom <span className="text-red-500">*</span>
            </span>
            <input
              name="first_name"
              required
              defaultValue={initial?.first_name ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Nom <span className="text-red-500">*</span>
            </span>
            <input
              name="last_name"
              required
              defaultValue={initial?.last_name ?? ""}
              className="input w-full"
            />
          </label>
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
            <input
              name="address"
              defaultValue={initial?.address ?? ""}
              className="input w-full"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Poste et contrat</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Poste <span className="text-red-500">*</span>
            </span>
            <input
              name="position"
              required
              defaultValue={initial?.position ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Département <span className="text-red-500">*</span>
            </span>
            <input
              name="department"
              required
              defaultValue={initial?.department ?? ""}
              className="input w-full"
              placeholder="ex : Vente, Finance, RH…"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Type de contrat <span className="text-red-500">*</span>
            </span>
            <select
              name="contract_type"
              defaultValue={initial?.contract_type ?? "cdi"}
              className="input w-full"
              required
            >
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
              <option value="stage">Stage</option>
              <option value="freelance">Freelance</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Date d&apos;embauche <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              name="hire_date"
              required
              defaultValue={initial?.hire_date ?? today}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Salaire (GNF)</span>
            <input
              type="number"
              name="salary_gnf"
              min={0}
              step={1000}
              defaultValue={initial?.salary_gnf ?? 0}
              className="input w-full"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Statut</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm text-darktext">Collaborateur actif</span>
        </label>
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
