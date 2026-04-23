import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  Filter,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring, listActivityLogs } from "@/lib/server/activity-logs";
import { isSuperAdmin } from "@/lib/server/permissions";
import { ActivityLogsVerifyUpload } from "@/components/admin/activity-logs-verify-upload";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

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
// Helpers — phrases humaines
// ---------------------------------------------------------------------------

const MODULE_LABELS: Record<string, string> = {
  clients:   "un client",
  produits:  "un produit",
  vente:     "une vente",
  users:     "un utilisateur",
  formation: "une formation",
  stock:     "le stock",
};

const ACTION_LABELS: Record<string, { phrase: string; icon: typeof PlusCircle; color: string; bg: string }> = {
  create: { phrase: "a ajouté",    icon: PlusCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  update: { phrase: "a modifié",   icon: Pencil,     color: "text-amber-600",   bg: "bg-amber-50"   },
  delete: { phrase: "a supprimé",  icon: Trash2,     color: "text-red-500",     bg: "bg-red-50"     },
};

function toHumanPhrase(moduleKey: string, actionKey: string): string {
  const action = ACTION_LABELS[actionKey]?.phrase ?? `a effectué "${actionKey}" sur`;
  const mod    = MODULE_LABELS[moduleKey] ?? `le module "${moduleKey}"`;
  return `${action} ${mod}`;
}

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)   return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

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
      .select("id, email")
      .in("id", actorIds as string[]);
    (profiles ?? []).forEach((p) => actorNames.set(p.id, p.email ?? shortId(p.id)));
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
            <label className="mb-1 block text-xs text-gray-500">Date de début</label>
            <input
              type="datetime-local"
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

      {/* ── Timeline ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

        {result.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-400">Aucun événement trouvé</p>
            <p className="text-xs text-gray-300">Modifiez vos filtres pour voir d&apos;autres résultats.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {result.data.map((row, idx) => {
              const actionCfg  = ACTION_LABELS[row.action_key] ?? ACTION_LABELS.update;
              const ActionIcon = actionCfg.icon;
              const actorName  = row.actor_user_id ? (actorNames.get(row.actor_user_id) ?? shortId(row.actor_user_id)) : "Système";
              const phrase     = toHumanPhrase(row.module_key, row.action_key);
              const isLast     = idx === result.data.length - 1;

              return (
                <div key={row.id} className="relative flex gap-4 px-5 py-4 hover:bg-gray-50/40 transition-colors">
                  {/* Ligne de timeline */}
                  {!isLast && (
                    <div className="absolute left-[2.6rem] top-12 bottom-0 w-px bg-gray-100" />
                  )}

                  {/* Icône action */}
                  <div className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actionCfg.bg}`}>
                    <ActionIcon size={14} className={actionCfg.color} />
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-darktext capitalize">
                          {actorName.split("@")[0]}
                        </span>
                        <span className="ml-1.5 text-sm text-gray-500">{phrase}</span>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{toRelativeTime(row.created_at)}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge
                        label={row.module_key}
                        variant="primary"
                      />
                      {row.target_table && row.target_id && (
                        <span className="font-mono text-xs text-gray-400">
                          #{shortId(row.target_id)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(row.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
