import type { DepartmentKpi } from "@/lib/governance/kpi/aggregate-kpi";

type DepartmentKpiCardProps = {
  department: DepartmentKpi;
};

const HEALTH_STYLES: Record<DepartmentKpi["health"], string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

export function DepartmentKpiCard({ department }: DepartmentKpiCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{department.departmentLabel}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${HEALTH_STYLES[department.health]}`}
        >
          {department.health}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Users</p>
          <p className="font-semibold text-gray-900">{department.usersCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Managers</p>
          <p className="font-semibold text-gray-900">{department.managersCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Act. 7j</p>
          <p className="font-semibold text-gray-900">{department.activityCount7d}</p>
        </div>
      </div>
    </article>
  );
}
