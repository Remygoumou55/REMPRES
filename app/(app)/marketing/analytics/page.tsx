import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Target, TrendingUp, Wallet } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingRead } from "@/lib/server/marketing-access";
import { getMarketingAnalytics } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import {
  CampaignStatusBadge,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/marketing/marketing-badges";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type CampaignStatus,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types/marketing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-purple-500",
  proposal: "bg-orange-500",
  converted: "bg-emerald-500",
  lost: "bg-red-500",
};

const SOURCE_COLORS: Record<string, string> = {
  campaign: "bg-blue-500",
  referral: "bg-emerald-500",
  website: "bg-purple-500",
  social: "bg-pink-500",
  event: "bg-orange-500",
  cold: "bg-gray-500",
  autre: "bg-slate-500",
};

export default async function MarketingAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingRead(user.id);

  const analytics = await getMarketingAnalytics();

  const totalStatusCount = analytics.leadsByStatus.reduce(
    (acc, s) => acc + s.count,
    0,
  );
  const maxSourceCount = Math.max(1, ...analytics.leadsBySource.map((s) => s.count));
  const maxChart = Math.max(1, ...analytics.chart7Days.map((d) => d.value));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Analytics Marketing"
        subtitle="Performance des campagnes et conversion du pipeline"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Target}
          label="Total leads"
          value={analytics.totalLeads}
          tone="blue"
          subtitle={`${analytics.newLeadsThisMonth} ce mois`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux de conversion"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          tone="emerald"
          subtitle={`${analytics.convertedLeads} convertis`}
        />
        <KpiCard
          icon={Wallet}
          label="Budget total"
          value={formatGNF(analytics.totalBudgetGnf)}
          tone="orange"
          subtitle={`${analytics.activeCampaigns} campagne${analytics.activeCampaigns > 1 ? "s" : ""} active${analytics.activeCampaigns > 1 ? "s" : ""}`}
        />
        <KpiCard
          icon={BarChart3}
          label="Pipeline estimé (GNF)"
          value={formatGNF(analytics.estimatedPipelineGnf)}
          tone="purple"
          subtitle="Leads non perdus / convertis"
        />
      </div>

      <section className="mt-8 card p-6">
        <h2 className="mb-4 text-base font-semibold text-darktext">
          Leads reçus par jour (7 derniers jours)
        </h2>
        <div className="flex items-end gap-3 h-48">
          {analytics.chart7Days.map((d) => {
            const heightPct = Math.round((d.value / maxChart) * 100);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.value} lead${d.value > 1 ? "s" : ""}`}
                  />
                </div>
                <span className="text-[10px] text-gray-500">
                  {d.date.slice(5)}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {d.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-darktext">
            Répartition des leads par statut
          </h2>
          {analytics.leadsByStatus.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun lead.</p>
          ) : (
            <div className="space-y-3">
              {analytics.leadsByStatus.map((s) => {
                const pct = totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0;
                return (
                  <div key={s.status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">
                        <LeadStatusBadge status={s.status as LeadStatus} />
                      </span>
                      <span className="tabular-nums text-gray-600">
                        {s.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${STATUS_COLORS[s.status] ?? "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-darktext">
            Leads par source d&apos;acquisition
          </h2>
          {analytics.leadsBySource.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun lead.</p>
          ) : (
            <div className="space-y-3">
              {analytics.leadsBySource.map((s) => {
                const pct = (s.count / maxSourceCount) * 100;
                return (
                  <div key={s.source}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <LeadSourceBadge source={s.source as LeadSource} />
                      <span className="tabular-nums font-semibold text-gray-700">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded bg-gray-100">
                      <div
                        className={`h-3 rounded ${SOURCE_COLORS[s.source] ?? "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-darktext">
            Top 5 campagnes par leads générés
          </h2>
          <Link
            href="/marketing/campagnes"
            className="text-xs font-medium text-primary hover:underline"
          >
            Voir toutes les campagnes →
          </Link>
        </div>
        {analytics.topCampaigns.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune campagne.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">Campagne</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Leads générés</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCampaigns.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="p-3">
                      <Link
                        href={`/marketing/campagnes/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="p-3">
                      <CampaignStatusBadge status={c.status as CampaignStatus} />
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {c.leads}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 card p-6">
        <h2 className="mb-3 text-base font-semibold text-darktext">
          Pipeline détaillé
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.keys(LEAD_STATUS_LABELS).map((s) => {
            const found = analytics.leadsByStatus.find((x) => x.status === s);
            return (
              <Link
                key={s}
                href={`/marketing/leads?status=${s}`}
                className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary/40"
              >
                <div className="text-xs font-medium text-gray-500">
                  {LEAD_STATUS_LABELS[s as LeadStatus]}
                </div>
                <div className="mt-1 text-2xl font-bold text-darktext">
                  {found?.count ?? 0}
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Sources : {Object.keys(LEAD_SOURCE_LABELS).length} canaux suivis.
        </p>
      </section>
    </div>
  );
}

type KpiTone = "blue" | "emerald" | "orange" | "purple";

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  subtitle,
}: {
  icon: typeof Target;
  label: string;
  value: number | string;
  tone: KpiTone;
  subtitle?: string;
}) {
  const tones: Record<KpiTone, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium opacity-80">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
          {subtitle ? (
            <div className="mt-1 text-xs opacity-70">{subtitle}</div>
          ) : null}
        </div>
        <Icon className="h-6 w-6 opacity-70" />
      </div>
    </div>
  );
}
