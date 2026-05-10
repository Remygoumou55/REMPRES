"use client";

import { useMemo } from "react";
import type { EmployeeDomainSnapshot } from "@/modules/hr/employees/types";

export function useOrgChart(snapshot: EmployeeDomainSnapshot) {
  const nodes = useMemo(() => snapshot.orgChart, [snapshot.orgChart]);
  const roots = useMemo(() => nodes.filter((node) => !node.managerId), [nodes]);
  return { nodes, roots };
}

