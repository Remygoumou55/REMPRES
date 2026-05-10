"use client";

import { useMemo, useState } from "react";
import type { EmployeeDomainSnapshot, EmployeeProfile } from "@/modules/hr/employees/types";
import { useEmployeeFilters } from "@/modules/hr/employees/hooks/use-employee-filters";

export function useEmployeeProfile(snapshot: EmployeeDomainSnapshot) {
  const { query, setQuery, department, setDepartment, filtered } = useEmployeeFilters(snapshot.profiles);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(filtered[0]?.id ?? null);

  const selected = useMemo<EmployeeProfile | null>(
    () => filtered.find((employee) => employee.id === selectedEmployeeId) ?? filtered[0] ?? null,
    [filtered, selectedEmployeeId],
  );

  return {
    query,
    setQuery,
    department,
    setDepartment,
    filteredProfiles: filtered,
    selectedEmployee: selected,
    setSelectedEmployeeId,
  };
}

