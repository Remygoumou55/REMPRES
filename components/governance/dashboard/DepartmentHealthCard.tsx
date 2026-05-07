import type { DepartmentKpi } from "@/lib/governance/kpi/aggregate-kpi";

type DepartmentHealthCardProps = {
  departments: DepartmentKpi[];
};

export function DepartmentHealthCard({ departments }: DepartmentHealthCardProps) {
  const healthy = departments.filter((d) => d.health === "healthy").length;
  const watch = departments.filter((d) => d.health === "watch").length;
  const critical = departments.filter((d) => d.health === "critical").length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Health departements</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
          Healthy: <span className="font-semibold">{healthy}</span>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">
          Watch: <span className="font-semibold">{watch}</span>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
          Critical: <span className="font-semibold">{critical}</span>
        </div>
      </div>
    </section>
  );
}
