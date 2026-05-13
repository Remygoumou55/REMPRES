import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getContractDetails, getContractDomainSnapshot } from "@/modules/hr/contracts/server/services/contract-service";
import { assertCanReadContracts } from "@/modules/hr/contracts/server/security/access";
import { ContractAdminWorkspace } from "@/modules/hr/contracts/components/ContractAdminWorkspace";
import { ContractRealtimeBridge } from "@/modules/hr/contracts/components/realtime/ContractRealtimeBridge";
import type { ContractDocument, ContractHistoryEvent } from "@/modules/hr/contracts/types";
import { PageHeader } from "@/components/ui/page-header";

export default async function RHContractsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await assertCanReadContracts(user.id))) redirect("/access-denied");

  const [{ messages }, snapshot] = await Promise.all([
    loadLocaleMessages(getRequestLocale()),
    getContractDomainSnapshot(),
  ]);
  const t = (key: string, fallback?: string) => translateFromDict(messages, key, fallback);

  const contractIds = snapshot.contracts.slice(0, 20).map((contract) => contract.id);
  const detailsArray = await Promise.all(contractIds.map((id) => getContractDetails(id)));
  const detailsByContractId = contractIds.reduce<Record<string, { documents: ContractDocument[]; history: ContractHistoryEvent[] }>>(
    (acc, id, index) => {
      const details = detailsArray[index];
      acc[id] = {
        documents: details.documents,
        history: details.history,
      };
      return acc;
    },
    {},
  );

  return (
    <div className="page-wrapper">
      <ContractRealtimeBridge />
      <PageHeader
        title={t("dashboard.rh.contracts.title", "Contrats RH Enterprise")}
        subtitle={t(
          "dashboard.rh.contracts.subtitle",
          "Gestion contrats, workflows, renouvellements, alertes, analytics, timeline et reporting.",
        )}
      />
      <ContractAdminWorkspace contracts={snapshot.contracts} detailsByContractId={detailsByContractId} />
    </div>
  );
}

