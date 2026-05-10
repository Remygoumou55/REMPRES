import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock3 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, getProfileAuthBrief, isAdminRole } from "@/lib/server/permissions";
import { getRhFoundationData } from "@/lib/server/rh-foundation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { RhAttendanceActions } from "./RhAttendanceActions";

export default async function RhPresencePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["rh"]);
  if (!perms.canRead) redirect("/access-denied");

  const data = await getRhFoundationData(user.id);
  const supabase = getSupabaseServerClient();
  const [adminRole, actorBrief] = await Promise.all([isAdminRole(user.id), getProfileAuthBrief(user.id)]);
  const canReadAllAttendance =
    adminRole ||
    (String(actorBrief.departmentKey ?? "").trim().toUpperCase() === "RH" &&
      (String(actorBrief.roleKey ?? "").trim().toLowerCase() === "manager" || perms.canUpdate));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const attendanceQuery = supabase
    .from("rh_attendance_events")
    .select("id,event_type,event_at,employee_id")
    .gte("event_at", startOfDay.toISOString())
    .order("event_at", { ascending: false })
    .limit(30);
  if (!canReadAllAttendance) {
    attendanceQuery.eq("employee_id", user.id);
  }
  const attendanceResult = await attendanceQuery;
  const attendance = attendanceResult.data ?? [];
  const checkIns = attendance.filter((entry) => entry.event_type === "check_in").length;
  const checkOuts = attendance.filter((entry) => entry.event_type === "check_out").length;

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="RH - Presences"
        subtitle="Etat des effectifs et disponibilite equipe"
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <Clock3 className="h-4 w-4 text-primary" />
            MAJ {formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true, locale: fr })}
          </div>
        }
      />

      <section className="card p-5">
        <h2 className="section-title mb-3">Pointage</h2>
        <RhAttendanceActions />
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">Etat equipe</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Collaborateurs actifs</p>
            <p className="mt-1 text-2xl font-bold text-darktext">{data.activeEmployees}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Collaborateurs inactifs</p>
            <p className="mt-1 text-2xl font-bold text-darktext">{data.inactiveEmployees}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Equipe RH active</p>
            <p className="mt-1 text-2xl font-bold text-darktext">{data.activeRhTeam}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Entrees aujourd&apos;hui</p>
            <p className="mt-1 text-2xl font-bold text-darktext">{checkIns}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Sorties aujourd&apos;hui</p>
            <p className="mt-1 text-2xl font-bold text-darktext">{checkOuts}</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">Journal des pointages</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun pointage aujourd&apos;hui.</p>
        ) : (
          <ul className="space-y-2">
            {attendance.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-sm text-darktext">
                  {entry.event_type === "check_in" ? "Entree" : entry.event_type === "check_out" ? "Sortie" : "Manuel"} ·{" "}
                  {entry.employee_id.slice(0, 8)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(entry.event_at), { addSuffix: true, locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">Suivi collaborateurs</h2>
        {data.recentEmployees.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune donnee disponible.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentEmployees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-sm text-darktext">{employee.fullName}</span>
                <span className="text-xs text-gray-500">
                  {employee.isActive ? "Actif" : "Inactif"} · {employee.roleKey}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

