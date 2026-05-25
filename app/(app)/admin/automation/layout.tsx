import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { AutomationOperationalWorkspace } from "@/modules/automation/components/dashboard/AutomationOperationalWorkspace";

export default async function AdminAutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const [superAdmin, admin, perms] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
    getModulePermissions(user.id, ["automation"]),
  ]);

  if (!superAdmin && !admin && !perms.canRead) redirect("/access-denied");

  return (
    <AutomationOperationalWorkspace canOperate={perms.canUpdate || superAdmin || admin}>
      {children}
    </AutomationOperationalWorkspace>
  );
}
