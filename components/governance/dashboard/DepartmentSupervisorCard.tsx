"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";

type DepartmentSupervisorCardProps = {
  departmentKey: DepartmentKey;
};

export function DepartmentSupervisorCard({ departmentKey }: DepartmentSupervisorCardProps) {
  const { t } = useTranslation();
  const dept = DEPARTMENT_NAVIGATION[departmentKey];
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{dept.label}</h2>
      <p className="mt-1 text-sm text-gray-600">
        {t("governance.supervision.cardSubtitle")}
      </p>
      <div className="mt-3">
        <Link
          href="/admin/activity-logs"
          className="inline-flex rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t("governance.supervision.openLogs")}
        </Link>
      </div>
    </article>
  );
}
