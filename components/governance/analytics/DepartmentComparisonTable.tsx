"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { DepartmentComparisonRow } from "@/lib/governance/analytics/aggregators/department-comparison";
import { TableShell } from "@/components/ui/table-shell";

export function DepartmentComparisonTable({ rows }: { rows: DepartmentComparisonRow[] }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.analytics.departmentComparison.title")}</h2>
      <TableShell className="mt-3">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">{t("common.rank")}</th>
              <th className="py-2">{t("common.department")}</th>
              <th className="py-2">{t("common.productivity")}</th>
              <th className="py-2">{t("common.activity7d")}</th>
              <th className="py-2">{t("common.users")}</th>
              <th className="py-2">{t("common.managers")}</th>
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
      </TableShell>
    </section>
  );
}
