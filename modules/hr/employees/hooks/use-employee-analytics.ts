"use client";

import { useMemo } from "react";
import type { EmployeeDomainSnapshot } from "@/modules/hr/employees/types";

export function useEmployeeAnalytics(snapshot: EmployeeDomainSnapshot) {
  return useMemo(
    () => ({
      total: snapshot.metrics.total,
      active: snapshot.metrics.active,
      inactive: snapshot.metrics.inactive,
      byDepartment: snapshot.metrics.byDepartment,
    }),
    [snapshot.metrics],
  );
}

