import type { EmployeeContract } from "@/modules/hr/contracts/types";
import { computeContractMetrics } from "@/modules/hr/contracts/analytics/contract-metrics";

export function buildContractReporting(contracts: EmployeeContract[]) {
  const metrics = computeContractMetrics(contracts);
  const byType = contracts.reduce<Record<string, number>>((acc, contract) => {
    acc[contract.contractType] = (acc[contract.contractType] ?? 0) + 1;
    return acc;
  }, {});
  return { metrics, byType };
}

