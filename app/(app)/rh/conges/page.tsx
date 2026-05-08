import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, getProfileAuthBrief, isAdminRole } from "@/lib/server/permissions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { RhLeavesClient } from "./RhLeavesClient";
import { RhLeaveStatusActions } from "./RhLeaveStatusActions";

type RhLeavesPageProps = {
  searchParams?: { status?: string; leaveType?: string };
};

export default async function RhLeavesPage({ searchParams }: RhLeavesPageProps) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["rh"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const [adminRole, actorBrief] = await Promise.all([isAdminRole(user.id), getProfileAuthBrief(user.id)]);
  const canReadAllLeaves =
    adminRole ||
    (String(actorBrief.departmentKey ?? "").trim().toUpperCase() === "RH" &&
      (String(actorBrief.roleKey ?? "").trim().toLowerCase() === "manager" || perms.canUpdate));
  const canManageLeaves = canReadAllLeaves && perms.canUpdate;

  const statusFilter = String(searchParams?.status ?? "").trim().toLowerCase();
  const leaveTypeFilter = String(searchParams?.leaveType ?? "").trim().toLowerCase();
  const allowedStatus = ["pending", "approved", "rejected", "cancelled"] as const;
  const allowedLeaveType = ["paid", "sick", "exceptional"] as const;
  const isAllowedStatus = (value: string): value is (typeof allowedStatus)[number] =>
    (allowedStatus as readonly string[]).includes(value);
  const isAllowedLeaveType = (value: string): value is (typeof allowedLeaveType)[number] =>
    (allowedLeaveType as readonly string[]).includes(value);

  const requestsQuery = supabase
    .from("rh_leave_requests")
    .select("id,leave_type,start_date,end_date,status,reason,created_at,requested_by")
    .order("created_at", { ascending: false })
    .limit(20);
  if (isAllowedStatus(statusFilter)) {
    requestsQuery.eq("status", statusFilter);
  }
  if (isAllowedLeaveType(leaveTypeFilter)) {
    requestsQuery.eq("leave_type", leaveTypeFilter);
  }
  if (!canReadAllLeaves) {
    requestsQuery.eq("requested_by", user.id);
  }

  const employeesPromise = perms.canCreate
    ? supabase
        .from("profiles")
        .select("id,first_name,last_name,email")
        .is("deleted_at", null)
        .neq("role_key", "super_admin")
        .order("last_name", { ascending: true })
        .limit(300)
    : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null; email: string | null }[] });

  const [employeesResult, requestsResult] = await Promise.all([employeesPromise, requestsQuery]);

  const employees =
    employeesResult.data?.map((row) => ({
      id: row.id,
      label: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email || row.id.slice(0, 8),
    })) ?? [];
  const requests = requestsResult.data ?? [];

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="RH - Conges"
        subtitle="Demandes de conges et suivi d'approbation"
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <CalendarClock className="h-4 w-4 text-primary" />
            Cycle RH
          </div>
        }
      />

      {perms.canCreate ? (
        <section className="card p-5">
          <h2 className="section-title mb-3">Nouvelle demande de conge</h2>
          <RhLeavesClient employees={employees} />
        </section>
      ) : null}

      <section className="card p-5">
        <form className="mb-4 grid gap-3 md:grid-cols-3" method="get" action="/rh/conges">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Statut</label>
            <select
              name="status"
              defaultValue={isAllowedStatus(statusFilter) ? statusFilter : ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuve</option>
              <option value="rejected">Rejete</option>
              <option value="cancelled">Annule</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Type de conge</label>
            <select
              name="leaveType"
              defaultValue={isAllowedLeaveType(leaveTypeFilter) ? leaveTypeFilter : ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="paid">Conge paye</option>
              <option value="sick">Conge maladie</option>
              <option value="exceptional">Conge exceptionnel</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
              Filtrer
            </button>
          </div>
        </form>
        <h2 className="section-title mb-3">Demandes recentes</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune demande enregistree.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-darktext">
                      {request.leave_type} · {request.status}
                    </p>
                    <p className="text-xs text-gray-500">{request.reason || "Sans motif detaille"}</p>
                    <p className="text-xs text-gray-400">
                      {request.start_date} → {request.end_date}
                    </p>
                    <RhLeaveStatusActions
                      leaveRequestId={request.id}
                      currentStatus={request.status}
                      canManage={canManageLeaves}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

