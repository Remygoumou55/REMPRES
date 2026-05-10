"use client";

import { useMemo, useState } from "react";
import type { EmployeeProfile } from "@/modules/hr/employees/types";

export function useEmployeeFilters(data: EmployeeProfile[]) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      const byText =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        String(item.email ?? "").toLowerCase().includes(q) ||
        item.roleKey.toLowerCase().includes(q);
      const byDepartment = !department || (item.departmentKey ?? "") === department;
      return byText && byDepartment;
    });
  }, [data, department, query]);

  return { query, setQuery, department, setDepartment, filtered };
}

