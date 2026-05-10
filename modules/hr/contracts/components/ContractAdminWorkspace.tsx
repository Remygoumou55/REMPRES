"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import type { ContractDocument, ContractHistoryEvent, EmployeeContract } from "@/modules/hr/contracts/types";
import { useContracts } from "@/modules/hr/contracts/hooks/use-contracts";
import { useContractAnalytics } from "@/modules/hr/contracts/hooks/use-contract-analytics";
import { ContractCreateForm } from "@/modules/hr/contracts/components/forms/ContractCreateForm";
import { ContractWorkflowActions } from "@/modules/hr/contracts/components/workflows/ContractWorkflowActions";
import { ContractAlertsPanel } from "@/modules/hr/contracts/components/alerts/ContractAlertsPanel";
import { ContractAnalyticsPanel } from "@/modules/hr/contracts/components/analytics/ContractAnalyticsPanel";
import { ContractTimelinePanel } from "@/modules/hr/contracts/components/timeline/ContractTimelinePanel";
import { ContractDocumentsPanel } from "@/modules/hr/contracts/components/documents/ContractDocumentsPanel";

type DetailsMap = Record<string, { documents: ContractDocument[]; history: ContractHistoryEvent[] }>;

const FILTER_STATUSES = ["draft", "pending_approval", "active", "renewal_due", "expired", "terminated"] as const;

export function ContractAdminWorkspace({
  contracts,
  detailsByContractId,
}: {
  contracts: EmployeeContract[];
  detailsByContractId: DetailsMap;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { query, setQuery, status, setStatus, filtered } = useContracts(contracts);
  const metrics = useContractAnalytics(filtered);
  const [selectedId, setSelectedId] = useState<string | null>(filtered[0]?.id ?? null);
  const selected = useMemo(
    () => filtered.find((contract) => contract.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );
  const details = selected ? detailsByContractId[selected.id] : undefined;

  const refresh = () => router.refresh();

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="section-title mb-3">{t("dashboard.rh.contracts.section.create", "Creation contrat")}</h2>
        <ContractCreateForm onCreated={refresh} />
      </section>

      <section className="card p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            placeholder={t("dashboard.rh.contracts.search.placeholder", "Recherche contrat...")}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm md:col-span-2"
          >
            <option value="">{t("dashboard.rh.contracts.status.all", "Tous statuts")}</option>
            {FILTER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`dashboard.rh.contracts.status.${s}`, s)}
              </option>
            ))}
          </select>
        </div>
        <ContractAnalyticsPanel metrics={metrics} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 space-y-2">
          <h2 className="section-title">{t("dashboard.rh.contracts.section.manage", "Gestion contrats")}</h2>
          <ul className="space-y-2">
            {filtered.map((contract) => (
              <li key={contract.id} className="rounded-lg border border-gray-200 p-2">
                <button type="button" className="w-full text-left text-xs" onClick={() => setSelectedId(contract.id)}>
                  {contract.contractType.toUpperCase()} · {t(`dashboard.rh.contracts.status.${contract.status}`, contract.status)} ·{" "}
                  {contract.employeeId}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="section-title">{t("dashboard.rh.contracts.section.workflow", "Workflow et timeline")}</h2>
          {selected ? (
            <>
              <ContractWorkflowActions contractId={selected.id} currentStatus={selected.status} />
              <ContractTimelinePanel events={details?.history ?? []} />
            </>
          ) : (
            <p className="text-xs text-gray-500">{t("dashboard.rh.contracts.empty.selection", "Aucun contrat selectionne.")}</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="section-title mb-2">{t("dashboard.rh.contracts.section.documents", "Documents contrats")}</h2>
          {selected ? (
            <ContractDocumentsPanel contractId={selected.id} documents={details?.documents ?? []} onDone={refresh} />
          ) : (
            <p className="text-xs text-gray-500">{t("dashboard.rh.contracts.empty.documents", "Selectionnez un contrat pour gerer les documents.")}</p>
          )}
        </section>
        <section className="card p-4">
          <h2 className="section-title mb-2">{t("dashboard.rh.contracts.section.alerts", "Alertes expirations et renouvellements")}</h2>
          <ContractAlertsPanel contracts={filtered} />
        </section>
      </div>
    </div>
  );
}
