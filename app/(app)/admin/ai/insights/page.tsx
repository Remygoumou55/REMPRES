import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAiInsightsRecent } from "@/modules/ai/server/repositories/ai-insights-repository";

export default async function AdminAiInsightsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAiInsightsRecent(supabase, 100);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ai", label: "AI" },
          { href: "/admin/ai/insights", label: "Insights" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
        <p className="mt-1 text-sm text-gray-600">
          Messages métier synthétiques avec <span className="font-medium">signal_refs</span> vers les sources ERP.
        </p>
      </section>

      <div className="space-y-3">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-900">
                {r.domain_key}
              </span>
              <span>confiance {Number(r.confidence).toFixed(2)}</span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <h2 className="mt-2 font-semibold text-gray-900">{r.title}</h2>
            <p className="mt-1 text-sm text-gray-700">{r.summary}</p>
            <p className="mt-2 font-mono text-[10px] text-gray-400">{r.insight_key}</p>
          </article>
        ))}
        {!rows.length ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aucun insight — exécuter le pipeline AI depuis Monitoring.
          </p>
        ) : null}
      </div>
    </>
  );
}
