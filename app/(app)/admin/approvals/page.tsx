import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { listApprovalRequests } from "@/lib/governance/approvals/repository";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { ApprovalDepartmentFilter } from "@/components/governance/approvals/ApprovalDepartmentFilter";
import { GovernanceApprovalTable } from "@/components/governance/approvals/GovernanceApprovalTable";
import { approveRequestAction, rejectRequestAction } from "./actions";
import { ApprovalsRealtimeBridge } from "@/components/governance/approvals/ApprovalsRealtimeBridge";
import type { ApprovalRequestStatus } from "@/lib/governance/approvals/types";

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
  const requests = await listApprovalRequests({
    status: statusFilter || undefined,
    departmentKey: searchParams?.department || undefined,
    actionType: searchParams?.action || undefined,
    limit: 120,
  });
  const departmentOptions = Array.from(new Set(requests.map((r) => r.departmentKey))).sort();
  const status = statusFilter;
  const department = searchParams?.department ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <ApprovalsRealtimeBridge />
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/approvals", label: "Centre d'approbation" },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Centre d&apos;approbation gouvernance</h1>
        <p className="mt-1 text-sm text-gray-600">
          Validation des actions sensibles, supervision des decisions et traçabilite.
        </p>
      </section>

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="expired">expired</option>
        </select>
        <ApprovalDepartmentFilter options={departmentOptions} selected={department} />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>
      </form>

      <GovernanceApprovalTable
        requests={requests}
        renderActions={(request) =>
          request.status === "pending" ? (
            <form action={async (formData) => {
              "use server";
              const action = String(formData.get("decision") ?? "");
              const requestId = String(formData.get("requestId") ?? "");
              const reason = String(formData.get("reason") ?? "");
              if (action === "approve") {
                await approveRequestAction(requestId);
                return;
              }
              await rejectRequestAction(requestId, reason);
            }} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="requestId" value={request.id} />
              <input
                type="text"
                name="reason"
                placeholder="Raison rejet (optionnel)"
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                type="submit"
                name="decision"
                value="approve"
                className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
              >
                Approuver
              </button>
              <button
                type="submit"
                name="decision"
                value="reject"
                className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white"
              >
                Rejeter
              </button>
            </form>
          ) : null
        }
      />
    </div>
  );
}
