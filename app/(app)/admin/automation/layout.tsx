import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isAutomationOperator } from "@/lib/server/permissions";
import { AutomationOperationalWorkspace } from "@/modules/automation/components/dashboard/AutomationOperationalWorkspace";

export default async function AdminAutomationLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isAutomationOperator(user.id);

  return <AutomationOperationalWorkspace canOperate={canOperate}>{children}</AutomationOperationalWorkspace>;
}
