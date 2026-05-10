"use client";

import { useMemo } from "react";
import type { EmployeeContract } from "@/modules/hr/contracts/types";
import { computeContractMetrics } from "@/modules/hr/contracts/analytics/contract-metrics";

export function useContractAnalytics(contracts: EmployeeContract[]) {
  return useMemo(() => computeContractMetrics(contracts), [contracts]);
}

