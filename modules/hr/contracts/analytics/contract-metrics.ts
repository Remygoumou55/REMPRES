import type { EmployeeContract } from "@/modules/hr/contracts/types";
import { isContractNearExpiration } from "@/modules/hr/contracts/utils";

export function computeContractMetrics(contracts: EmployeeContract[]) {
  const total = contracts.length;
  const active = contracts.filter((contract) => contract.status === "active").length;
  const renewalDue = contracts.filter(
    (contract) => contract.status === "active" && isContractNearExpiration(contract.endDate, contract.renewalWindowDays),
  ).length;
  const expired = contracts.filter((contract) => contract.status === "expired").length;

  return { total, active, renewalDue, expired };
}

