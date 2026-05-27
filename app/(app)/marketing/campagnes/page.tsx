import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit, Eye, Megaphone, Pause, Play, Plus, Trash2 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingRead } from "@/lib/server/marketing-access";
import { listCampaignsWithMetrics } from "@/lib/server/marketing";
import {
  computeRates,
  formatRate,
  getRateBg,
  getRateColor,
} from "@/lib/utils/campaign-analytics";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  CampaignStatusBadge,
  CampaignTypeBadge,
} from "@/components/marketing/marketing-badges";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignStatus,
  type CampaignType,
} from "@/lib/types/marketing";
import {
  deleteCampaignAction,
  updateCampaignStatusAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    q?: string;
    type?: string;
    status?: string;
    success?: string;
    error?: string;
  };
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

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function formatDateRange(start: string | null, end: string | null) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR");
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `Dès ${fmt(start)}`;
  if (end) return `Jusqu'au ${fmt(end)}`;
  return "—";
}

export default async function CampagnesPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingRead(user.id);

  const { data, total, totalBudget, activeCount, totalLeads } =
    await listCampaignsWithMetrics({
    search: searchParams?.q,
    type: searchParams?.type ?? "all",
    status: searchParams?.status ?? "all",
  });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Campagnes"
        subtitle={`${total} campagne${total > 1 ? "s" : ""}`}
        actions={
          <Link
            href="/marketing/campagnes/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={total} tone="blue" />
        <SummaryCard label="Actives" value={activeCount} tone="emerald" />
        <SummaryCard label="Budget total" value={formatGNF(totalBudget)} tone="orange" />
        <SummaryCard label="Leads générés" value={totalLeads} tone="purple" />
      </div>

      <form method="get" className="my-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher par titre, objectif…"
          className="input max-w-xs"
        />
        <select
          name="type"
          defaultValue={searchParams?.type ?? "all"}
          className="input max-w-[200px]"
        >
          <option value="all">Tous les types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {CAMPAIGN_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams?.status ?? "all"}
          className="input max-w-[180px]"
        >
          <option value="all">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {CAMPAIGN_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Megaphone className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune campagne</p>
          <p className="text-xs">
            Cliquez sur « Nouvelle campagne » pour lancer votre première campagne
            marketing.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Titre</th>
                <th className="p-3">Type</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Budget</th>
                <th className="p-3 text-right">Envoyés</th>
                <th className="p-3 text-right">Ouvertures</th>
                <th className="p-3 text-right">Conversions</th>
                <th className="p-3">Dates</th>
                <th className="p-3 text-right">Leads</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <Link
                      href={`/marketing/campagnes/${c.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.title}
                    </Link>
                    {c.goal ? (
                      <div className="mt-0.5 max-w-md truncate text-xs text-gray-500">
                        {c.goal}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <CampaignTypeBadge type={c.type} />
                  </td>
                  <td className="p-3">
                    <CampaignStatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {formatGNF(Number(c.budget_gnf))}
                  </td>
                  <td className="p-3 text-right tabular-nums text-gray-700">
                    {c.sent_count > 0 ? c.sent_count.toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <AnalyticsRateBadge
                      sent={c.sent_count}
                      rate={computeRates(c).open_rate}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <AnalyticsRateBadge
                      sent={c.sent_count}
                      rate={computeRates(c).conversion_rate}
                    />
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    {formatDateRange(c.start_date, c.end_date)}
                  </td>
                  <td className="p-3 text-right tabular-nums font-medium">
                    {c.leads_count ?? 0}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/marketing/campagnes/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Link>
                      <Link
                        href={`/marketing/campagnes/${c.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
                      >
                        <Edit className="h-3.5 w-3.5" /> Modifier
                      </Link>
                      {c.status === "active" ? (
                        <form
                          action={updateCampaignStatusAction.bind(null, c.id, "paused")}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"
                          >
                            <Pause className="h-3.5 w-3.5" /> Pause
                          </button>
                        </form>
                      ) : c.status === "draft" || c.status === "paused" ? (
                        <form
                          action={updateCampaignStatusAction.bind(null, c.id, "active")}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
                          >
                            <Play className="h-3.5 w-3.5" /> Activer
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteCampaignAction.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsRateBadge({
  sent,
  rate,
}: {
  sent: number;
  rate: number;
}) {
  if (sent <= 0) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{
        color: getRateColor(rate),
        backgroundColor: getRateBg(rate),
      }}
    >
      {formatRate(rate)}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "blue" | "emerald" | "orange" | "purple";
}) {
  const tones: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
