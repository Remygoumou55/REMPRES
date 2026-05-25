import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, Inbox } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead, canRhManageLeaves } from "@/lib/server/rh-access";
import { countPendingLeaveRequests, listLeaveRequests } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  LeaveStatusBadge,
  LeaveTypeBadge,
} from "@/components/rh/rh-badges";
import { approveLeaveAction, rejectLeaveAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { status?: string; success?: string; error?: string };
};

const TABS: { id: string; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente" },
  { id: "approved", label: "Approuvées" },
  { id: "rejected", label: "Refusées" },
];

function durationDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.floor((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export default async function CongesPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const tab = TABS.some((t) => t.id === searchParams?.status)
    ? searchParams!.status!
    : "all";

  const [{ data, total }, pendingCount, canManage] = await Promise.all([
    listLeaveRequests({ status: tab }),
    countPendingLeaveRequests(),
    canRhManageLeaves(user.id),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Congés"
        subtitle={`${total} demande${total > 1 ? "s" : ""} · ${pendingCount} en attente`}
        actions={
          <Link
            href="/rh/conges/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <CalendarPlus className="h-4 w-4" />
            Nouvelle demande
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {TABS.map((t) => {
          const active = tab === t.id;
          const params = new URLSearchParams();
          if (t.id !== "all") params.set("status", t.id);
          const href = params.toString() ? `/rh/conges?${params}` : "/rh/conges";
          return (
            <Link
              key={t.id}
              href={href}
              className={`border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              {t.label}
              {t.id === "pending" && pendingCount > 0 ? (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Inbox className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune demande</p>
          <p className="text-xs">
            Les demandes de congés des collaborateurs apparaîtront ici.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Collaborateur</th>
                <th className="p-3">Type</th>
                <th className="p-3">Du</th>
                <th className="p-3">Au</th>
                <th className="p-3">Durée</th>
                <th className="p-3">Motif</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => {
                const emp = l.employee;
                const empName = emp
                  ? `${emp.first_name} ${emp.last_name}`
                  : l.employee_id.slice(0, 8);
                return (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        href={`/rh/collaborateurs/${l.employee_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {empName}
                      </Link>
                      {emp?.department ? (
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <LeaveTypeBadge type={l.leave_type} />
                    </td>
                    <td className="p-3">{l.start_date}</td>
                    <td className="p-3">{l.end_date}</td>
                    <td className="p-3">
                      {durationDays(l.start_date, l.end_date)} j
                    </td>
                    <td className="p-3 max-w-xs truncate" title={l.reason ?? ""}>
                      {l.reason ?? "—"}
                    </td>
                    <td className="p-3">
                      <LeaveStatusBadge status={l.status} />
                    </td>
                    <td className="p-3">
                      {canManage && l.status === "pending" ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <form action={approveLeaveAction.bind(null, l.id)}>
                            <button
                              type="submit"
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              aria-label="Approuver"
                            >
                              ✓ Approuver
                            </button>
                          </form>
                          <form action={rejectLeaveAction.bind(null, l.id)}>
                            <button
                              type="submit"
                              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                              aria-label="Rejeter"
                            >
                              ✗ Rejeter
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
