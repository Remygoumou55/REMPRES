import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, FileJson } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getActivityLogsMonitoring,
  listActivityLogs,
  type ActivityLogsFilters,
} from "@/lib/server/activity-logs";
import { isAdminRole } from "@/lib/server/permissions";
import { ActivityLogsVerifyUpload } from "@/components/admin/activity-logs-verify-upload";
import { ActivityLogsSearchList } from "@/components/admin/activity-logs-search-list";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  formatProfileDisplayName,
  displayNameFromEmail,
} from "@/lib/server/profile-display";
import { DEFAULT_PAGE_SIZE } from "@/lib/data-listing";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityLogsPageProps = {
  searchParams?: {
    page?: string;
    pageSize?: "10" | "25" | "50";
    filter?: string;
    moduleKey?: string;
    actionKey?: string;
    actorUserId?: string;
    targetId?: string;
    from?: string;
    to?: string;
  };
};

type ActivityLogFilterTab = "all" | "operations" | "approbations" | "systeme";

const FILTER_TABS: ReadonlyArray<{ id: ActivityLogFilterTab; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "operations", label: "Opérations" },
  { id: "approbations", label: "Approbations" },
  { id: "systeme", label: "Système" },
];

const OPERATIONS_MODULE_KEYS = [
  "clients",
  "produits",
  "vente",
  "finance",
  "formation",
  "consultation",
  "rh",
  "marketing",
  "logistique",
] as const;

const SYSTEM_MODULE_KEYS = ["auth", "parametres", "utilisateurs", "admin"] as const;

function parseFilterTab(value?: string): ActivityLogFilterTab {
  if (value === "operations" || value === "approbations" || value === "systeme") return value;
  return "all";
}

function presetFiltersForTab(tab: ActivityLogFilterTab): ActivityLogsFilters {
  switch (tab) {
    case "operations":
      return { moduleKeysIn: OPERATIONS_MODULE_KEYS };
    case "approbations":
      return { actionKey: "approve" };
    case "systeme":
      return { moduleKeysIn: SYSTEM_MODULE_KEYS };
    default:
      return {};
  }
}

function appendSearchParams(
  base: URLSearchParams,
  searchParams?: ActivityLogsPageProps["searchParams"],
  overrides?: { filter?: ActivityLogFilterTab; page?: string; pageSize?: string },
) {
  const filterTab = overrides?.filter ?? parseFilterTab(searchParams?.filter);
  if (filterTab !== "all") base.set("filter", filterTab);
  const pageSize = overrides?.pageSize ?? searchParams?.pageSize;
  if (pageSize) base.set("pageSize", pageSize);
  if (searchParams?.moduleKey?.trim()) base.set("moduleKey", searchParams.moduleKey.trim());
  if (searchParams?.actionKey?.trim() && filterTab !== "approbations") {
    base.set("actionKey", searchParams.actionKey.trim());
  }
  if (searchParams?.actorUserId?.trim()) base.set("actorUserId", searchParams.actorUserId.trim());
  if (searchParams?.targetId?.trim()) base.set("targetId", searchParams.targetId.trim());
  if (searchParams?.from) base.set("from", searchParams.from);
  if (searchParams?.to) base.set("to", searchParams.to);
  if (overrides?.page) base.set("page", overrides.page);
}

function buildFilterTabHref(
  tab: ActivityLogFilterTab,
  searchParams?: ActivityLogsPageProps["searchParams"],
): string {
  const p = new URLSearchParams();
  appendSearchParams(p, searchParams, { filter: tab, page: "1" });
  const qs = p.toString();
  return qs ? `/admin/activity-logs?${qs}` : "/admin/activity-logs";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ActivityLogsPage({ searchParams }: ActivityLogsPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  try {
    const allowed = await isAdminRole(data.user.id);
    if (!allowed) redirect("/access-denied");
  } catch {
    redirect("/access-denied");
  }

  const page     = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? String(DEFAULT_PAGE_SIZE)) as 10 | 25 | 50;
  const activeFilterTab = parseFilterTab(searchParams?.filter);
  const presetFilters = presetFiltersForTab(activeFilterTab);
  const filters: ActivityLogsFilters = {
    ...presetFilters,
    moduleKey: searchParams?.moduleKey?.trim() || undefined,
    actionKey:
      activeFilterTab === "approbations"
        ? "approve"
        : searchParams?.actionKey?.trim() || undefined,
    actorUserId: searchParams?.actorUserId?.trim() || undefined,
    targetId:    searchParams?.targetId?.trim()    || undefined,
    from:        searchParams?.from || undefined,
    to:          searchParams?.to   || undefined,
  };

  const result     = await listActivityLogs({ page, pageSize, filters });
  const monitoring = await getActivityLogsMonitoring({ moduleKey: "clients" });

  // Résoudre les noms des acteurs (profiles) + options de filtre utilisateur.
  const { data: actorRows } = await supabase
    .from("activity_logs")
    .select("actor_user_id")
    .not("actor_user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(300);
  const actorIds = Array.from(
    new Set(
      [
        ...result.data.map((r) => r.actor_user_id),
        ...((actorRows ?? []).map((r) => r.actor_user_id) as string[]),
      ].filter(Boolean),
    ),
  );
  const actorNames: Map<string, string> = new Map();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", actorIds as string[]);
    (profiles ?? []).forEach((p) => {
      const label =
        formatProfileDisplayName(p.first_name, p.last_name).trim() ||
        displayNameFromEmail(p.email) ||
        shortId(p.id);
      actorNames.set(p.id, label);
    });
  }
  const actorOptions = actorIds
    .map((id) => ({ id, label: actorNames.get(id) ?? shortId(id) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const buildUrl = (nextPage: number) => {
    const p = new URLSearchParams();
    appendSearchParams(p, searchParams, {
      filter: activeFilterTab,
      page: String(nextPage),
      pageSize: String(result.pageSize),
    });
    return `/admin/activity-logs?${p.toString()}`;
  };

  const exportParams = new URLSearchParams();
  appendSearchParams(exportParams, searchParams, { filter: activeFilterTab });
  if (filters.moduleKey)   exportParams.set("moduleKey",   filters.moduleKey);
  if (filters.actionKey)   exportParams.set("actionKey",   filters.actionKey);
  if (filters.actorUserId) exportParams.set("actorUserId", filters.actorUserId);
  if (filters.targetId)    exportParams.set("targetId",    filters.targetId);
  if (filters.from)        exportParams.set("from",        filters.from ?? "");
  if (filters.to)          exportParams.set("to",          filters.to   ?? "");
  const qs = exportParams.toString() ? `?${exportParams.toString()}` : "";

  return (
    <div className="page-wrapper mx-auto max-w-5xl space-y-5">

      {/* ── Header ── */}
      <PageHeader
        title="Journaux applicatifs"
        subtitle={`${result.total} entrée${result.total > 1 ? "s" : ""} — journal système / applicatif (hors audit métier).`}
        actions={
          <div className="flex gap-2">
            <a
              href={`/admin/activity-logs/export${qs}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <Download size={13} />
              CSV
            </a>
            <a
              href={`/admin/activity-logs/export-json${qs}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary/90"
            >
              <FileJson size={13} />
              JSON signé
            </a>
          </div>
        }
      />

      {/* ── Onglets filtre ── */}
      <nav
        className="mb-4 flex flex-row flex-wrap gap-2"
        aria-label="Filtrer les journaux par catégorie"
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilterTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={buildFilterTabHref(tab.id, searchParams)}
              className="rounded-full border text-[13px] font-medium transition-colors"
              style={
                active
                  ? {
                      backgroundColor: "#0E4A8A",
                      borderColor: "#0E4A8A",
                      color: "#ffffff",
                      padding: "5px 14px",
                    }
                  : {
                      background: "var(--color-background-secondary, var(--secondary))",
                      border: "0.5px solid var(--color-border-tertiary, var(--border))",
                      color: "var(--color-text-secondary, var(--muted-foreground))",
                      padding: "5px 14px",
                    }
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Alerte monitoring ── */}
      {monitoring.alertLevel === "warning" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Alerte audit :</strong> {monitoring.deleteCountLast24h} suppression(s) de clients
            détectée(s) dans les 24 dernières heures.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">
            Audit OK — {monitoring.deleteCountLast24h} suppression(s) clients sur les 24 dernières heures.
          </p>
        </div>
      )}

      {/* ── Filtres ── */}
      <FilterPanelShell>
        <form method="get" action="/admin/activity-logs">
        {activeFilterTab !== "all" ? (
          <input type="hidden" name="filter" value={activeFilterTab} />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Module</label>
            <input
              name="moduleKey"
              defaultValue={filters.moduleKey ?? ""}
              placeholder="clients, produits, vente…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Action</label>
            <select
              name="actionKey"
              defaultValue={filters.actionKey ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Toutes les actions</option>
              <option value="create">Ajout</option>
              <option value="update">Modification</option>
              <option value="delete">Suppression</option>
              <option value="RESTORE">Restauration</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Utilisateur</label>
            <select
              name="actorUserId"
              defaultValue={filters.actorUserId ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous les utilisateurs</option>
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Date début</label>
            <input
              type="date"
              name="from"
              defaultValue={filters.from ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Date fin</label>
            <input
              type="date"
              name="to"
              defaultValue={filters.to ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">ID cible</label>
            <input
              name="targetId"
              defaultValue={filters.targetId ?? ""}
              placeholder="ID ressource (optionnel)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <input type="hidden" name="pageSize" value={String(result.pageSize)} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Appliquer
          </button>
          {(filters.moduleKey ||
            filters.actionKey ||
            filters.actorUserId ||
            filters.targetId ||
            filters.from ||
            filters.to ||
            activeFilterTab !== "all") && (
            <Link
              href="/admin/activity-logs"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Réinitialiser
            </Link>
          )}
        </div>
        </form>
      </FilterPanelShell>

      <ActivityLogsSearchList
        resetHref="/admin/activity-logs"
        items={result.data.map((row) => ({
          ...row,
          actorName: row.actor_user_id
            ? (actorNames.get(row.actor_user_id) ?? shortId(row.actor_user_id))
            : "Système",
        }))}
      />

      <PaginationBar page={result.page} totalPages={result.totalPages} buildHref={buildUrl} />

      {/* ── Vérification d'intégrité ── */}
      <ActivityLogsVerifyUpload />

    </div>
  );
}
