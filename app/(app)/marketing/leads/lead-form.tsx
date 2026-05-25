import Link from "next/link";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types/marketing";

type Props = {
  action: (formData: FormData) => void;
  initial?: Partial<Lead>;
  campaigns: { id: string; label: string }[];
  defaultCampaignId?: string;
  submitLabel?: string;
  backHref?: string;
};

const SOURCES: LeadSource[] = [
  "campaign",
  "referral",
  "website",
  "social",
  "event",
  "cold",
  "autre",
];
const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
  "lost",
];

export function LeadForm({
  action,
  initial,
  campaigns,
  defaultCampaignId,
  submitLabel = "Enregistrer",
  backHref = "/marketing/leads",
}: Props) {
  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Contact</h2>
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
            <span className="text-xs font-medium text-gray-600">Entreprise</span>
            <input
              name="company"
              defaultValue={initial?.company ?? ""}
              className="input w-full"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold text-darktext">Qualification</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Source <span className="text-red-500">*</span>
            </span>
            <select
              name="source"
              required
              defaultValue={initial?.source ?? "autre"}
              className="input w-full"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Campagne</span>
            <select
              name="campaign_id"
              defaultValue={initial?.campaign_id ?? defaultCampaignId ?? ""}
              className="input w-full"
            >
              <option value="">— Aucune —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Statut</span>
            <select
              name="status"
              defaultValue={initial?.status ?? "new"}
              className="input w-full"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Valeur estimée (GNF)
            </span>
            <input
              type="number"
              name="estimated_value_gnf"
              min={0}
              step={1000}
              defaultValue={initial?.estimated_value_gnf ?? 0}
              className="input w-full"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ""}
              className="input w-full"
            />
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
