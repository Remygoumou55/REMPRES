import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isMultitenantOperator } from "@/lib/server/permissions";
import { MultitenantOperationalWorkspace } from "@/modules/multitenant/components/dashboard/MultitenantOperationalWorkspace";

export default async function AdminMultitenantLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isMultitenantOperator(user.id);

  return <MultitenantOperationalWorkspace canOperate={canOperate}>{children}</MultitenantOperationalWorkspace>;
}
