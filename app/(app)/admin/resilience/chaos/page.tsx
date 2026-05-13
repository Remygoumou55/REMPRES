import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listResilienceScenariosBrief } from "@/modules/resilience/server/repositories/resilience-scenarios-read-repository";

export default async function AdminResilienceChaosPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const scenarios = await listResilienceScenariosBrief(supabase);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Chaos engineering</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scénarios déclaratifs <span className="font-medium">erp_resilience_scenarios</span> (catégorie chaos) ;
          exécutions suivies dans <span className="font-medium">erp_resilience_validation_runs</span>.
        </p>
        <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
          {scenarios.filter((s) => s.category === "chaos").length === 0 ? (
            <li className="p-3 text-gray-500">Aucun scénario chaos (migration 059).</li>
          ) : (
            scenarios
              .filter((s) => s.category === "chaos")
              .map((s) => (
                <li key={s.id} className="flex flex-wrap justify-between gap-2 p-3">
                  <span className="font-medium text-gray-900">{s.scenario_key}</span>
                  <span className="text-xs text-gray-600">{s.enabled ? "actif" : "off"}</span>
                </li>
              ))
          )}
        </ul>
        <Link href="/admin/resilience/load-testing" className="mt-4 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Charge distribuée →
        </Link>
      </section>
    </>
  );
}
