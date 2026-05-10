import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isEcosystemOperator } from "@/lib/server/permissions";
import { EcosystemOperationalWorkspace } from "@/modules/ecosystem/components/dashboard/EcosystemOperationalWorkspace";

export default async function AdminEcosystemLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isEcosystemOperator(user.id);

  return <EcosystemOperationalWorkspace canOperate={canOperate}>{children}</EcosystemOperationalWorkspace>;
}
