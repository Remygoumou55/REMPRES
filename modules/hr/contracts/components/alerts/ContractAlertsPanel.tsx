"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { EmployeeContract } from "@/modules/hr/contracts/types";
import { isContractNearExpiration } from "@/modules/hr/contracts/utils";

export function ContractAlertsPanel({ contracts }: { contracts: EmployeeContract[] }) {
  const { t } = useTranslation();
  const alerts = contracts.filter(
    (contract) =>
      contract.status === "expired" ||
      (contract.status === "active" && isContractNearExpiration(contract.endDate, contract.renewalWindowDays)),
  );
  if (!alerts.length) {
    return <p className="text-xs text-gray-500">{t("dashboard.rh.contracts.alerts.empty", "Aucune alerte contrat.")}</p>;
  }
  return (
    <ul className="space-y-2">
      {alerts.slice(0, 20).map((contract) => (
        <li key={contract.id} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          {contract.contractType.toUpperCase()} · {t(`dashboard.rh.contracts.status.${contract.status}`, contract.status)} ·{" "}
          {t("dashboard.rh.contracts.alerts.end", "Echeance")}: {contract.endDate ?? "—"}
        </li>
      ))}
    </ul>
  );
}
