import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Edit,
  FileText,
  Pause,
  Play,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertMarketingRead,
  canMarketingDelete,
} from "@/lib/server/marketing-access";
import { getCampaignById, listLeads } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  CampaignStatusBadge,
  CampaignTypeBadge,
  LeadStatusBadge,
} from "@/components/marketing/marketing-badges";
import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/types/marketing";
import {
  CampaignAnalyticsSection,
  metricsFromCampaign,
} from "@/components/marketing/CampaignAnalyticsSection";
import {
  deleteCampaignAction,
  updateCampaignStatusAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { tab?: string; success?: string; error?: string };
};

const VALID_TABS = new Set(["overview", "leads", "stats"]);

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "—";
}

export default async function CampaignDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingRead(user.id);

  const [campaign, canDelete, leadsResult] = await Promise.all([
    getCampaignById(params.id),
    canMarketingDelete(user.id),
    listLeads({ campaign_id: params.id, limit: 200 }),
  ]);
  if (!campaign) notFound();

  const tab = VALID_TABS.has(searchParams?.tab ?? "")
    ? searchParams!.tab!
    : "overview";

  const totalLeads = leadsResult.total;
  const convertedLeads = leadsResult.byStatus.converted ?? 0;
  const budget = Number(campaign.budget_gnf ?? 0);
  const costPerLead = totalLeads > 0 ? budget / totalLeads : 0;

  // Build a 7-day chart of leads received for this campaign
  const chartMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    chartMap.set(d, 0);
  }
  leadsResult.data.forEach((l) => {
    const d = l.created_at.slice(0, 10);
    if (chartMap.has(d)) chartMap.set(d, (chartMap.get(d) ?? 0) + 1);
  });
  const chartEntries = Array.from(chartMap.entries());
  const maxChartVal = Math.max(1, ...chartEntries.map(([, v]) => v));

  const leadStatusOrder: LeadStatus[] = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "converted",
    "lost",
  ];

  return (
    <div className="page-wrapper">
      <PageHeader
        title={campaign.title}
        subtitle={`${CAMPAIGN_TYPE_LABELS[campaign.type]}${campaign.channel ? ` · ${campaign.channel}` : ""}`}
        breadcrumbs={
          <Link
            href="/marketing/campagnes"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux campagnes
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CampaignTypeBadge type={campaign.type} />
            <CampaignStatusBadge status={campaign.status} />
            <Link
              href={`/marketing/campagnes/${campaign.id}/edit`}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            {campaign.status === "active" ? (
              <form
                action={updateCampaignStatusAction.bind(
                  null,
                  campaign.id,
                  "paused",
                )}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                >
                  <Pause className="h-4 w-4" />
                  Mettre en pause
                </button>
              </form>
            ) : campaign.status === "draft" || campaign.status === "paused" ? (
              <form
                action={updateCampaignStatusAction.bind(
                  null,
                  campaign.id,
                  "active",
                )}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Play className="h-4 w-4" />
                  Activer
                </button>
              </form>
            ) : null}
            {campaign.status !== "completed" && campaign.status !== "cancelled" ? (
              <form
                action={updateCampaignStatusAction.bind(
                  null,
                  campaign.id,
                  "completed",
                )}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminer
                </button>
              </form>
            ) : null}
            {canDelete ? (
              <form action={deleteCampaignAction.bind(null, campaign.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </form>
            ) : null}
          </div>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="mb-6">
        <CampaignAnalyticsSection
          campaignId={campaign.id}
          metrics={metricsFromCampaign(campaign)}
        />
      </div>

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {[
          { id: "overview", label: "Vue d'ensemble", icon: FileText },
          { id: "leads", label: `Leads (${totalLeads})`, icon: Target },
          { id: "stats", label: "Statistiques", icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/marketing/campagnes/${campaign.id}?tab=${t.id}`}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === "overview" ? (
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <InfoField label="Titre" value={campaign.title} />
          <InfoField label="Type" value={CAMPAIGN_TYPE_LABELS[campaign.type]} />
          <InfoField label="Statut" value={<CampaignStatusBadge status={campaign.status} />} />
          <InfoField label="Canal" value={campaign.channel ?? "—"} />
          <InfoField label="Budget" value={formatGNF(budget)} />
          <InfoField
            label="Dates"
            value={`${formatDate(campaign.start_date)} → ${formatDate(campaign.end_date)}`}
          />
          <InfoField
            label="Description"
            value={campaign.description ?? "—"}
            className="md:col-span-2"
          />
          <InfoField
            label="Objectif"
            value={campaign.goal ?? "—"}
            className="md:col-span-2"
          />
          <InfoField
            label="Audience cible"
            value={campaign.target_audience ?? "—"}
            className="md:col-span-2"
          />
          <InfoField
            label="Leads associés"
            value={String(campaign.leads_count ?? totalLeads)}
          />
          <InfoField label="Notes" value={campaign.notes ?? "—"} className="md:col-span-2" />
        </section>
      ) : null}

      {tab === "leads" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-darktext">
              Leads de cette campagne
            </h2>
            <Link
              href={`/marketing/leads/new?campaignId=${campaign.id}`}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Ajouter un lead
            </Link>
          </div>
          {leadsResult.data.length === 0 ? (
            <p className="card p-6 text-sm text-gray-500">
              Aucun lead pour cette campagne.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Entreprise</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Valeur</th>
                    <th className="p-3">Reçu le</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsResult.data.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="p-3">
                        <Link
                          href={`/marketing/leads/${l.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {l.first_name} {l.last_name}
                        </Link>
                      </td>
                      <td className="p-3">{l.company ?? "—"}</td>
                      <td className="p-3">
                        <LeadStatusBadge status={l.status} />
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatGNF(Number(l.estimated_value_gnf))}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {new Date(l.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "stats" ? (
        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-darktext">
              Leads par jour (7 derniers jours)
            </h2>
            <div className="flex items-end gap-2 h-40">
              {chartEntries.map(([date, value]) => {
                const heightPct = Math.round((value / maxChartVal) * 100);
                return (
                  <div key={date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{ height: `${heightPct}%` }}
                        title={`${value} lead${value > 1 ? "s" : ""}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {date.slice(5)}
                    </span>
                    <span className="text-xs font-semibold">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-darktext">
              Répartition par statut
            </h2>
            <div className="space-y-3">
              {leadStatusOrder.map((s) => {
                const count = leadsResult.byStatus[s] ?? 0;
                const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">
                        {LEAD_STATUS_LABELS[s]}
                      </span>
                      <span className="tabular-nums text-gray-600">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card grid gap-4 p-6 sm:grid-cols-3">
            <StatCard label="Budget engagé" value={formatGNF(budget)} />
            <StatCard
              label="ROI estimé"
              value={
                totalLeads > 0 && budget > 0
                  ? `${((convertedLeads / totalLeads) * 100).toFixed(0)}% de conversion`
                  : "—"
              }
            />
            <StatCard
              label="Coût par lead"
              value={totalLeads > 0 ? formatGNF(costPerLead) : "—"}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-darktext">{value}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-darktext">{value}</div>
    </div>
  );
}
