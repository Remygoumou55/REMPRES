import { MetricCard } from "@/modules/hr/employees/ui/cards/MetricCard";

export function EmployeeAnalyticsPanel({
  metrics,
}: {
  metrics: { total: number; active: number; inactive: number; byDepartment: Record<string, number> };
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Actifs" value={metrics.active} />
        <MetricCard label="Inactifs" value={metrics.inactive} />
      </div>
      <div className="rounded-xl border border-gray-200 p-2">
        <p className="text-xs font-medium text-gray-600">Repartition par departement</p>
        <ul className="mt-2 space-y-1">
          {Object.entries(metrics.byDepartment).map(([department, count]) => (
            <li key={department} className="text-xs text-gray-700">
              {department}: {count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

