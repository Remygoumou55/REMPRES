import type { DepartmentComparisonRow } from "@/lib/governance/analytics/aggregators/department-comparison";

export function DepartmentComparisonTable({ rows }: { rows: DepartmentComparisonRow[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Department comparison</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Rank</th>
              <th className="py-2">Department</th>
              <th className="py-2">Productivity</th>
              <th className="py-2">Act. 7j</th>
              <th className="py-2">Users</th>
              <th className="py-2">Managers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.departmentKey} className="border-t border-gray-100">
                <td className="py-2">{row.rank}</td>
                <td className="py-2 font-medium text-gray-900">{row.departmentLabel}</td>
                <td className="py-2">{row.productivityScore}</td>
                <td className="py-2">{row.activityCount7d}</td>
                <td className="py-2">{row.usersCount}</td>
                <td className="py-2">{row.managersCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
