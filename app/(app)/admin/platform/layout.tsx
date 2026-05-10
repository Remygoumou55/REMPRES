import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isPlatformOperator } from "@/lib/server/permissions";
import { PlatformOperationalWorkspace } from "@/modules/platform/components/dashboard/PlatformOperationalWorkspace";

export default async function AdminPlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isPlatformOperator(user.id);

  return <PlatformOperationalWorkspace canOperate={canOperate}>{children}</PlatformOperationalWorkspace>;
}
