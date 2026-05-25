import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Edit, Eye, Plus, Target, Trash2 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingRead } from "@/lib/server/marketing-access";
import { listCampaignsForSelect, listLeads } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/marketing/marketing-badges";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types/marketing";
import { convertLeadToClientAction, deleteLeadAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    q?: string;
    status?: string;
    source?: string;
    campaign?: string;
    success?: string;
    error?: string;
  };
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

const STATUS_TABS: { id: LeadStatus | "all"; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveau" },
  { id: "contacted", label: "Contacté" },
  { id: "qualified", label: "Qualifié" },
  { id: "proposal", label: "Proposition" },
  { id: "converted", label: "Converti" },
  { id: "lost", label: "Perdu" },
];

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function LeadsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingRead(user.id);

  const statusParam = searchParams?.status ?? "all";
  const validStatus = STATUS_TABS.some((t) => t.id === statusParam);
  const status = validStatus ? statusParam : "all";

  const [{ data, total, byStatus }, campaigns] = await Promise.all([
    listLeads({
      status,
      source: searchParams?.source ?? "all",
      campaign_id: searchParams?.campaign || undefined,
      search: searchParams?.q,
      limit: 100,
    }),
    listCampaignsForSelect(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Leads"
        subtitle={`${total} lead${total > 1 ? "s" : ""} dans le pipeline`}
        actions={
          <Link
            href="/marketing/leads/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un lead
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher par nom, entreprise…"
          className="input max-w-xs"
        />
        <select
          name="source"
          defaultValue={searchParams?.source ?? "all"}
          className="input max-w-[180px]"
        >
          <option value="all">Toutes les sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {LEAD_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="campaign"
          defaultValue={searchParams?.campaign ?? ""}
          className="input max-w-[220px]"
        >
          <option value="">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="status" value={status} />
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {STATUS_TABS.map((t) => {
          const active = status === t.id;
          const count = t.id === "all" ? total : (byStatus[t.id] ?? 0);
          return (
            <Link
              key={t.id}
              href={`/marketing/leads?status=${t.id}`}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              {t.label}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Target className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun lead</p>
          <p className="text-xs">
            Cliquez sur « Ajouter un lead » pour démarrer votre pipeline.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Nom</th>
                <th className="p-3">Entreprise</th>
                <th className="p-3">Source</th>
                <th className="p-3">Campagne</th>
                <th className="p-3 text-right">Valeur estimée</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => {
                const canConvert =
                  l.status === "qualified" || l.status === "proposal";
                return (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        href={`/marketing/leads/${l.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {l.first_name} {l.last_name}
                      </Link>
                      {l.email ? (
                        <div className="text-xs text-gray-500">{l.email}</div>
                      ) : null}
                    </td>
                    <td className="p-3">{l.company ?? "—"}</td>
                    <td className="p-3">
                      <LeadSourceBadge source={l.source} />
                    </td>
                    <td className="p-3 text-xs">
                      {l.campaign?.title ?? "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatGNF(Number(l.estimated_value_gnf))}
                    </td>
                    <td className="p-3">
                      <LeadStatusBadge status={l.status} />
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {new Date(l.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                          href={`/marketing/leads/${l.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" /> Voir
                        </Link>
                        <Link
                          href={`/marketing/leads/${l.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
                        >
                          <Edit className="h-3.5 w-3.5" /> Modifier
                        </Link>
                        {canConvert ? (
                          <form
                            action={convertLeadToClientAction.bind(null, l.id)}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
                            >
                              <ArrowRight className="h-3.5 w-3.5" /> Convertir
                            </button>
                          </form>
                        ) : null}
                        <form action={deleteLeadAction.bind(null, l.id)}>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pipeline summary */}
      <section className="mt-8 card p-6">
        <h2 className="mb-3 text-base font-semibold text-darktext">
          Vue d&apos;ensemble du pipeline
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_TABS.filter((t) => t.id !== "all").map((t) => {
            const count = byStatus[t.id] ?? 0;
            return (
              <Link
                key={t.id}
                href={`/marketing/leads?status=${t.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary/40"
              >
                <div className="text-xs font-medium text-gray-500">
                  {LEAD_STATUS_LABELS[t.id as LeadStatus]}
                </div>
                <div className="mt-1 text-2xl font-bold text-darktext">{count}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
