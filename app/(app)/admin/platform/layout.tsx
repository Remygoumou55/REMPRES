import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PlatformOperationalWorkspace } from "@/modules/platform/components/dashboard/PlatformOperationalWorkspace";

export default async function AdminPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const [superAdmin, admin, perms] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
    getModulePermissions(user.id, ["platform"]),
  ]);

  if (!superAdmin && !admin && !perms.canRead) redirect("/access-denied");

  return (
    <PlatformOperationalWorkspace canOperate={perms.canUpdate || superAdmin || admin}>
      {children}
    </PlatformOperationalWorkspace>
  );
}
