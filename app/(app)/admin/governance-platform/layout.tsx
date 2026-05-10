import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isGovernancePlatformOperator } from "@/lib/server/permissions";
import { GovernancePlatformOperationalWorkspace } from "@/modules/governance-platform/components/dashboard/GovernancePlatformOperationalWorkspace";

export default async function AdminGovernancePlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isGovernancePlatformOperator(user.id);

  return (
    <GovernancePlatformOperationalWorkspace canOperate={canOperate}>{children}</GovernancePlatformOperationalWorkspace>
  );
}
