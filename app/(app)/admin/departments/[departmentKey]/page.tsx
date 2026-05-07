import { redirect } from "next/navigation";
import {
  DEPARTMENT_NAVIGATION,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { parseDepartmentKeySlug } from "@/lib/governance/sidebar-config";
import { DepartmentSwitcher } from "@/components/governance/layout/DepartmentSwitcher";
import { DepartmentSupervisorCard } from "@/components/governance/dashboard/DepartmentSupervisorCard";
import { GovernanceHomeCenter } from "@/components/governance/home/GovernanceHomeCenter";
import { getGovernanceHomeModel } from "@/lib/governance/home-config";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";

type PageProps = {
  params: { departmentKey: string };
};

function assertSupervisedDepartment(key: DepartmentKey): boolean {
  const nav = DEPARTMENT_NAVIGATION[key];
  return !nav.supervisionOnly && nav.routePrefixes.length > 0;
}

export default async function DepartmentSupervisionPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const departmentKey = parseDepartmentKeySlug(params.departmentKey);
  if (!departmentKey || !assertSupervisedDepartment(departmentKey)) {
    redirect("/admin/global-dashboard");
  }

  const userDisplayName = await getCachedProfileDisplayName(data.user.id);
  const model = getGovernanceHomeModel({
    roleKey: "super_admin",
    departmentKey,
    supervisionScope: "global",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Supervision departement - {DEPARTMENT_NAVIGATION[departmentKey].label}
          </h1>
          <p className="text-sm text-gray-600">
            Consultation gouvernance uniquement. Aucune operation CRUD metier.
          </p>
        </div>
        <DepartmentSwitcher currentDepartmentKey={departmentKey} />
      </div>

      <DepartmentSupervisorCard departmentKey={departmentKey} />
      <GovernanceHomeCenter model={model} userDisplayName={userDisplayName} />
    </div>
  );
}
