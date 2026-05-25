import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AdminPlatformEventsPage() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_platform_external_event_outbox")
    .select("id,topic_key,tenant_id,correlation_id,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw new Error(error.message);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Outbox événements externes" subtitle="Append-only — intégrations partenaires." />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map((e) => (
              <tr key={e.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{e.topic_key}</td>
                <td className="px-4 py-2 text-xs">{e.tenant_id?.slice(0, 8) ?? "global"}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{e.created_at?.slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
