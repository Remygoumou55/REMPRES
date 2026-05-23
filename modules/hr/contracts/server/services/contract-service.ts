import { buildContractHistory } from "@/modules/hr/contracts/history/build-contract-history";
import { buildContractReporting } from "@/modules/hr/contracts/reporting/build-contract-report";
import { buildContractTimeline } from "@/modules/hr/contracts/timeline/build-contract-timeline";
import { refreshRhContractLifecycleStatuses } from "@/modules/hr/contracts/server/services/lifecycle-sync";
import { listContractDocuments } from "@/modules/hr/contracts/server/repositories/documents-repository";
import { getContractById, listContracts } from "@/modules/hr/contracts/server/repositories/contracts-repository";
import { listContractHistory } from "@/modules/hr/contracts/server/repositories/history-repository";
import {
  evaluateAndEmitHrContractExpiringEvents,
  resolveHrContractExpiryActorUserId,
} from "@/lib/hr/runtime/hr-contract-expiry-evaluator";

export async function getContractDomainSnapshot() {
  await refreshRhContractLifecycleStatuses();
  const contracts = await listContracts();
  void resolveHrContractExpiryActorUserId().then((actorUserId) =>
    evaluateAndEmitHrContractExpiringEvents(
      contracts.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        endDate: c.endDate,
        renewalWindowDays: c.renewalWindowDays,
        status: c.status,
      })),
      { actorUserId },
    ),
  ).catch((err) => {
    console.warn(
      "[hr-contract-expiry-evaluator]",
      err instanceof Error ? err.message : err,
    );
  });
  const reporting = buildContractReporting(contracts);
  const proactiveAlerts = contracts
    .filter((contract) => contract.status === "renewal_due" || contract.status === "expired")
    .slice(0, 12)
    .map((contract) => `contract:${contract.id}:${contract.status}`);
  return { contracts, reporting, proactiveAlerts };
}

export async function getContractDetails(contractId: string) {
  await refreshRhContractLifecycleStatuses();
  const [contract, documents, history] = await Promise.all([
    getContractById(contractId),
    listContractDocuments(contractId),
    listContractHistory(contractId),
  ]);
  return {
    contract,
    documents,
    history: buildContractHistory(history),
    timeline: buildContractTimeline(history),
  };
}

