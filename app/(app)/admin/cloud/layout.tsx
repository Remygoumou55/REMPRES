import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isCloudOperator } from "@/lib/server/permissions";
import { CloudOperationalWorkspace } from "@/modules/cloud/components/dashboard/CloudOperationalWorkspace";

export default async function AdminCloudLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isCloudOperator(user.id);

  return <CloudOperationalWorkspace canOperate={canOperate}>{children}</CloudOperationalWorkspace>;
}
