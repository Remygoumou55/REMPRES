import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { ObservabilityOperationalWorkspace } from "@/modules/observability/components/dashboard/ObservabilityOperationalWorkspace";

export default async function AdminObservabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const [superAdmin, admin, perms] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
    getModulePermissions(user.id, ["observability"]),
  ]);

  if (!superAdmin && !admin && !perms.canRead) redirect("/access-denied");

  return (
    <ObservabilityOperationalWorkspace canOperate={perms.canUpdate || superAdmin || admin}>
      {children}
    </ObservabilityOperationalWorkspace>
  );
}
