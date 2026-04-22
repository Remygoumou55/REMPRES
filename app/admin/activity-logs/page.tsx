import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring, listActivityLogs } from "@/lib/server/activity-logs";
import { isSuperAdmin } from "@/lib/server/permissions";
import { ActivityLogsVerifyUpload } from "@/components/admin/activity-logs-verify-upload";

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

function toJsonPreview(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}

export default async function ActivityLogsPage({ searchParams }: ActivityLogsPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) {
    redirect("/access-denied");
  }

  const page = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "10") as 10 | 25 | 50;
  const filters = {
    moduleKey: searchParams?.moduleKey?.trim() || undefined,
    actionKey: searchParams?.actionKey?.trim() || undefined,
    actorUserId: searchParams?.actorUserId?.trim() || undefined,
    targetId: searchParams?.targetId?.trim() || undefined,
    from: searchParams?.from || undefined,
    to: searchParams?.to || undefined,
  };
  const result = await listActivityLogs({ page, pageSize, filters });
  const monitoring = await getActivityLogsMonitoring({ moduleKey: "clients" });

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("pageSize", String(result.pageSize));
    if (filters.moduleKey) params.set("moduleKey", filters.moduleKey);
    if (filters.actionKey) params.set("actionKey", filters.actionKey);
    if (filters.actorUserId) params.set("actorUserId", filters.actorUserId);
    if (filters.targetId) params.set("targetId", filters.targetId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return `/admin/activity-logs?${params.toString()}`;
  };

  const exportParams = new URLSearchParams();
  if (filters.moduleKey) exportParams.set("moduleKey", filters.moduleKey);
  if (filters.actionKey) exportParams.set("actionKey", filters.actionKey);
  if (filters.actorUserId) exportParams.set("actorUserId", filters.actorUserId);
  if (filters.targetId) exportParams.set("targetId", filters.targetId);
  if (filters.from) exportParams.set("from", filters.from);
  if (filters.to) exportParams.set("to", filters.to);
  const exportHref = `/admin/activity-logs/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold text-darktext">Journal d&apos;activité</h1>
          <p className="mt-1 text-sm text-darktext/80">{result.total} événement(s)</p>
        </div>

        {monitoring.alertLevel === "warning" ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Alerte audit: {monitoring.deleteCountLast24h} suppression(s) sur les 24 dernières heures
            dans le module clients.
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Monitoring audit: {monitoring.deleteCountLast24h} suppression(s) clients sur les 24 dernières
            heures.
          </div>
        )}

        <form className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-3">
          <input
            name="moduleKey"
            defaultValue={filters.moduleKey ?? ""}
            placeholder="Module (ex: clients)"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <select
            name="actionKey"
            defaultValue={filters.actionKey ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Toutes actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
          <input
            name="actorUserId"
            defaultValue={filters.actorUserId ?? ""}
            placeholder="Actor user id"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            name="targetId"
            defaultValue={filters.targetId ?? ""}
            placeholder="Target id"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            type="datetime-local"
            name="from"
            defaultValue={filters.from ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            type="datetime-local"
            name="to"
            defaultValue={filters.to ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <input type="hidden" name="pageSize" value={String(result.pageSize)} />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white sm:col-span-3"
          >
            Filtrer
          </button>
        </form>

        <div className="flex flex-wrap justify-end gap-2">
          <a
            href={exportHref}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-darktext"
          >
            Exporter CSV
          </a>
          <a
            href={`/admin/activity-logs/export-json${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Exporter JSON signé
          </a>
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-darktext/80">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Utilisateur</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Cible</th>
                <th className="px-3 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.actor_user_id}</td>
                  <td className="px-3 py-2">{row.module_key}</td>
                  <td className="px-3 py-2">{row.action_key}</td>
                  <td className="px-3 py-2">
                    {row.target_table ?? "-"} / {row.target_id ?? "-"}
                  </td>
                  <td className="max-w-[420px] px-3 py-2">
                    <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words text-xs text-darktext/80">
                      {toJsonPreview(row.metadata)}
                    </pre>
                  </td>
                </tr>
              ))}
              {result.data.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-darktext/70" colSpan={6}>
                    Aucun log d&apos;activité.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-darktext/80">
            Page {result.page} / {result.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={result.page > 1 ? buildUrl(result.page - 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page > 1
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Précédent
            </Link>
            <Link
              href={result.page < result.totalPages ? buildUrl(result.page + 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page < result.totalPages
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Suivant
            </Link>
          </div>
        </div>

        <ActivityLogsVerifyUpload />
      </div>
    </main>
  );
}
