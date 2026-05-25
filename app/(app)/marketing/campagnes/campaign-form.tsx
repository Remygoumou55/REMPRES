import Link from "next/link";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type Campaign,
  type CampaignStatus,
  type CampaignType,
} from "@/lib/types/marketing";

type Props = {
  action: (formData: FormData) => void;
  initial?: Partial<Campaign>;
  submitLabel?: string;
  backHref?: string;
};

const TYPES: CampaignType[] = [
  "email",
  "social",
  "sms",
  "event",
  "radio",
  "affichage",
  "autre",
];
const STATUSES: CampaignStatus[] = [
  "draft",
  "active",
  "paused",
  "completed",
  "cancelled",
];

export function CampaignForm({
  action,
  initial,
  submitLabel = "Enregistrer",
  backHref = "/marketing/campagnes",
}: Props) {
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Informations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Titre <span className="text-red-500">*</span>
            </span>
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Type <span className="text-red-500">*</span>
            </span>
            <select
              name="type"
              required
              defaultValue={initial?.type ?? "autre"}
              className="input w-full"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {CAMPAIGN_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Canal</span>
            <input
              name="channel"
              defaultValue={initial?.channel ?? ""}
              className="input w-full"
              placeholder="ex : Facebook, Mailjet, Orange…"
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
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Objectif de la campagne
            </span>
            <textarea
              name="goal"
              rows={2}
              defaultValue={initial?.goal ?? ""}
              className="input w-full"
              placeholder="ex : Générer 50 leads, lancer le nouveau produit…"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Planification</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Date de début</span>
            <input
              type="date"
              name="start_date"
              defaultValue={initial?.start_date ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Date de fin</span>
            <input
              type="date"
              name="end_date"
              defaultValue={initial?.end_date ?? ""}
              className="input w-full"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Audience cible
            </span>
            <textarea
              name="target_audience"
              rows={2}
              defaultValue={initial?.target_audience ?? ""}
              className="input w-full"
              placeholder="ex : Entreprises 20-100 salariés à Conakry"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Budget &amp; statut</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Budget (GNF)</span>
            <input
              type="number"
              name="budget_gnf"
              min={0}
              step={1000}
              defaultValue={initial?.budget_gnf ?? 0}
              className="input w-full"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Statut</span>
            <select
              name="status"
              defaultValue={initial?.status ?? "draft"}
              className="input w-full"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CAMPAIGN_STATUS_LABELS[s]}
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
