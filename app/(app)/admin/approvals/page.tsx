import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { listApprovalRequests } from "@/lib/governance/approvals/repository";
import { ApprovalDepartmentFilter } from "@/components/governance/approvals/ApprovalDepartmentFilter";
import { GovernanceApprovalTable } from "@/components/governance/approvals/GovernanceApprovalTable";
import { approveRequestAction, rejectRequestAction } from "./actions";
import { ApprovalsRealtimeBridge } from "@/components/governance/approvals/ApprovalsRealtimeBridge";
import type { ApprovalRequestStatus } from "@/lib/governance/approvals/types";
import { APPROVAL_STATUSES, statusTranslationKey } from "@/lib/i18n/statuses";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { PageHeader } from "@/components/ui/page-header";
import { ModulePageStack } from "@/components/ui/module-page-stack";
import { ApprovalDecisionFields } from "@/components/governance/approvals/ApprovalDecisionFields";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

type PageProps = {
  searchParams?: {
    status?: string;
    department?: string;
    action?: string;
  };
};

export default async function AdminApprovalsPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const statusFilter = (searchParams?.status ?? "") as ApprovalRequestStatus | "";
  const [requests, locale] = await Promise.all([listApprovalRequests({
    status: statusFilter || undefined,
    departmentKey: searchParams?.department || undefined,
    actionType: searchParams?.action || undefined,
    limit: 120,
  }), getRequestLocale()]);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);
  const departmentOptions = Array.from(new Set(requests.map((r) => r.departmentKey))).sort();
  const status = statusFilter;
  const department = searchParams?.department ?? "";

  return (
    <div className="page-wrapper">
      <ModulePageStack>
        <ApprovalsRealtimeBridge />

        <PageHeader
          title="Centre d&apos;approbation"
          subtitle="Validation des actions sensibles, supervision des décisions et traçabilité."
        />

      <FilterPanelShell>
      <form className="flex flex-wrap items-center gap-2" method="get">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {APPROVAL_STATUSES.map((approvalStatus) => (
            <option key={approvalStatus} value={approvalStatus}>
              {t(statusTranslationKey(approvalStatus))}
            </option>
          ))}
        </select>
        <ApprovalDepartmentFilter options={departmentOptions} selected={department} />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>
      </form>
      </FilterPanelShell>

      <GovernanceApprovalTable
        requests={requests}
        renderActions={(request) =>
          request.status === "pending" ? (
            <form
              action={async (formData) => {
                "use server";
                const actionName = String(formData.get("decision") ?? "");
                const requestId = String(formData.get("requestId") ?? "");
                const reason = String(formData.get("reason") ?? "");
                if (actionName === "approve") {
                  await approveRequestAction(requestId);
                  return;
                }
                await rejectRequestAction(requestId, reason);
              }}
              className="space-y-0"
            >
              <ApprovalDecisionFields requestId={request.id} />
            </form>
          ) : null
        }
      />
      </ModulePageStack>
    </div>
  );
}
