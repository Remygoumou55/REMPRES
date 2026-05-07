import type { DepartmentKpi } from "@/lib/governance/kpi/aggregate-kpi";
import { DepartmentKpiCard } from "./DepartmentKpiCard";

type DepartmentOverviewSectionProps = {
  departments: DepartmentKpi[];
};

export function DepartmentOverviewSection({ departments }: DepartmentOverviewSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">KPI par departement</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <DepartmentKpiCard key={department.departmentKey} department={department} />
        ))}
      </div>
    </section>
  );
}
