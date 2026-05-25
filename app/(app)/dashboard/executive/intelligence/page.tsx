import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertExecutiveDashboardRead } from "@/modules/executive-dashboard/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { buildExecutiveBiSnapshot } from "@/modules/executive-dashboard/server/services/executive-bi-engine";
import { buildCrossDomainIntelligence } from "@/modules/executive-dashboard/server/services/executive-cross-domain-intelligence";
import { listOpenExecutiveSignals } from "@/modules/executive-dashboard/server/services/executive-alerting-service";

export default async function ExecutiveIntelligencePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  try {
    await assertExecutiveDashboardRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  const supabase = getSupabaseServerClient();
  const [bi, cross, signals] = await Promise.all([
    buildExecutiveBiSnapshot(supabase),
    buildCrossDomainIntelligence(supabase),
    listOpenExecutiveSignals(supabase),
  ]);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Intelligence exécutive"
        subtitle="BI gouverné, corrélations cross-domain et signaux actifs."
        actions={
          <Link href="/dashboard/executive" className="text-sm font-medium text-primary hover:underline">
            ← Centre exécutif
          </Link>
        }
      />

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">KPI Registry (ONE TRUTH)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {bi.kpis.map((k) => (
            <li key={k.kpiKey} className="flex justify-between gap-4 border-b border-gray-50 py-2">
              <span>
                {k.label} <span className="text-gray-400">({k.domainKey})</span>
              </span>
              <span className="font-mono tabular-nums">
                {k.value} · <span className="capitalize">{k.status}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Cross-domain</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {cross.insights.map((i) => (
            <li key={i.id} className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium">
                {i.domains.join(" ↔ ")} · {i.severity}
              </p>
              <p className="mt-1 text-gray-600">{i.insight}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Signaux ouverts</h2>
        {signals.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Aucun signal critique.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {signals.map((s) => (
              <li key={s.id} className="rounded border border-amber-100 bg-amber-50/60 p-3">
                <span className="font-medium capitalize">{s.severity}</span> — {s.title}
                <p className="text-gray-600">{s.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
