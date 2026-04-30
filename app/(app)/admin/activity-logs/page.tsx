import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, FileJson, Filter } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring, listActivityLogs } from "@/lib/server/activity-logs";
import { isSuperAdmin } from "@/lib/server/permissions";
import { ActivityLogsVerifyUpload } from "@/components/admin/activity-logs-verify-upload";
import { ActivityLogsSearchList } from "@/components/admin/activity-logs-search-list";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatProfileDisplayName,
  displayNameFromEmail,
} from "@/lib/server/profile-display";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityLogsPageProps = {
  searchParams?: {
    page?: string;
    pageSize?: "10" | "25" | "50";
    moduleKey?: string;
    actionKey?: string;
    actorUserId?: string;
    targetId?: string;
    from?: string;
    to?: string;
  };
};

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
    const allowed = await isSuperAdmin(data.user.id);
    if (!allowed) redirect("/access-denied");
  } catch {
    redirect("/access-denied");
  }

  const page     = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "25") as 10 | 25 | 50;
  const filters  = {
    moduleKey:   searchParams?.moduleKey?.trim()   || undefined,
    actionKey:   searchParams?.actionKey?.trim()   || undefined,
    actorUserId: searchParams?.actorUserId?.trim() || undefined,
    targetId:    searchParams?.targetId?.trim()    || undefined,
    from:        searchParams?.from || undefined,
    to:          searchParams?.to   || undefined,
  };

  const result     = await listActivityLogs({ page, pageSize, filters });
  const monitoring = await getActivityLogsMonitoring({ moduleKey: "clients" });

  // Résoudre les noms des acteurs (profiles)
  const actorIds = Array.from(new Set(result.data.map((r) => r.actor_user_id).filter(Boolean)));
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

  const buildUrl = (nextPage: number) => {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    p.set("pageSize", String(result.pageSize));
    if (filters.moduleKey)   p.set("moduleKey",   filters.moduleKey);
    if (filters.actionKey)   p.set("actionKey",   filters.actionKey);
    if (filters.actorUserId) p.set("actorUserId", filters.actorUserId);
    if (filters.targetId)    p.set("targetId",    filters.targetId);
    if (filters.from)        p.set("from",        filters.from);
    if (filters.to)          p.set("to",          filters.to);
    return `/admin/activity-logs?${p.toString()}`;
  };

  const exportParams = new URLSearchParams();
  if (filters.moduleKey)   exportParams.set("moduleKey",   filters.moduleKey);
  if (filters.actionKey)   exportParams.set("actionKey",   filters.actionKey);
  if (filters.actorUserId) exportParams.set("actorUserId", filters.actorUserId);
  if (filters.from)        exportParams.set("from",        filters.from ?? "");
  if (filters.to)          exportParams.set("to",          filters.to   ?? "");
  const qs = exportParams.toString() ? `?${exportParams.toString()}` : "";

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* ── Header ── */}
      <PageHeader
        title="Journal d'activité"
        subtitle={`${result.total} événement${result.total > 1 ? "s" : ""} enregistré${result.total > 1 ? "s" : ""}`}
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
      <form className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Filter size={12} />
          Filtres
        </div>
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
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Date (jour)</label>
            <input
              type="date"
              name="from"
              defaultValue={filters.from ?? ""}
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
          {(filters.moduleKey || filters.actionKey || filters.from) && (
            <Link href="/admin/activity-logs" className="text-sm text-gray-400 hover:text-gray-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      <ActivityLogsSearchList
        resetHref="/admin/activity-logs"
        items={result.data.map((row) => ({
          ...row,
          actorName: row.actor_user_id
            ? (actorNames.get(row.actor_user_id) ?? shortId(row.actor_user_id))
            : "Système",
        }))}
      />

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
        <p className="text-sm text-gray-500">
          Page <span className="font-semibold text-darktext">{result.page}</span> sur{" "}
          <span className="font-semibold text-darktext">{result.totalPages}</span>
        </p>
        <div className="flex gap-2">
          <Link
            href={result.page > 1 ? buildUrl(result.page - 1) : "#"}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              result.page > 1
                ? "border border-gray-200 text-darktext hover:bg-gray-50"
                : "cursor-not-allowed border border-gray-100 text-gray-300"
            }`}
          >
            ← Précédent
          </Link>
          <Link
            href={result.page < result.totalPages ? buildUrl(result.page + 1) : "#"}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              result.page < result.totalPages
                ? "border border-gray-200 text-darktext hover:bg-gray-50"
                : "cursor-not-allowed border border-gray-100 text-gray-300"
            }`}
          >
            Suivant →
          </Link>
        </div>
      </div>

      {/* ── Vérification d'intégrité ── */}
      <ActivityLogsVerifyUpload />

    </div>
  );
}
