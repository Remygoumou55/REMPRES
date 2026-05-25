import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listPlatformApiRegistry } from "@/modules/platform/server/repositories/api-registry-repository";
import { PlatformApiGovernancePanel } from "@/modules/platform/components/governance/PlatformApiGovernancePanel";

export default async function AdminPlatformApisPage() {
  const supabase = getSupabaseServerClient();
  let registry: Awaited<ReturnType<typeof listPlatformApiRegistry>> = [];
  try {
    registry = await listPlatformApiRegistry(supabase);
  } catch {
    /* migration 067 pending */
  }

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="API Governance" subtitle="Registry, versioning, auth, rate limits et audit." />
      <PlatformApiGovernancePanel />
      {registry.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Registry SQL ({registry.length})</h2>
          <ul className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs">
            {registry.map((r) => (
              <li key={r.api_key}>
                {r.api_key} — {r.lifecycle_status} — {r.rate_limit_per_minute}/min
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
