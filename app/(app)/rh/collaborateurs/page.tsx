import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadEmployeeDomain } from "@/modules/hr/employees/server/security/access";
import { getEmployeeDomainSnapshot } from "@/modules/hr/employees/server/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeAdminWorkspace } from "@/modules/hr/employees/components/profile/EmployeeAdminWorkspace";

export default async function RhCollaborateursPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  if (!(await assertCanReadEmployeeDomain(user.id))) redirect("/access-denied");
  const snapshot = await getEmployeeDomainSnapshot();
  const employees = snapshot.profiles;

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="RH - Collaborateurs"
        subtitle="Annuaire collaborateurs, roles et departements"
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <Users className="h-4 w-4 text-primary" />
            {snapshot.metrics.total} profils · {snapshot.hierarchy.length} liens hierarchiques
          </div>
        }
      />

      {employees.length ? (
        <EmployeeAdminWorkspace snapshot={snapshot} />
      ) : (
        <section className="card p-5 text-sm text-gray-500">Aucun collaborateur disponible.</section>
      )}
    </div>
  );
}

