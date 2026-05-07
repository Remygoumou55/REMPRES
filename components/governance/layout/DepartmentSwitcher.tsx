"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";

type DepartmentSwitcherProps = {
  currentDepartmentKey: DepartmentKey;
};

export function DepartmentSwitcher({ currentDepartmentKey }: DepartmentSwitcherProps) {
  const router = useRouter();
  const options = useMemo(
    () =>
      Object.entries(DEPARTMENT_NAVIGATION)
        .filter(([, nav]) => !nav.supervisionOnly && nav.routePrefixes.length > 0)
        .map(([key, nav]) => ({ key: key as DepartmentKey, label: nav.label })),
    [],
  );

  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
      Departement
      <select
        value={currentDepartmentKey}
        onChange={(e) => router.push(`/admin/departments/${e.target.value.toLowerCase()}`)}
        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
