import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
export default async function AdminObservabilityHealthPage() {
  const supabase = getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("erp_observability_health_snapshots")
    .select("id,scope_key,health_score,computed_at")
    .order("computed_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Santé plateforme" subtitle="Scores de santé agrégés — scope global et services." />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[600px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Calculé</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.scope_key}</td>
                <td className="px-3 py-2 font-semibold">{r.health_score}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{r.computed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
