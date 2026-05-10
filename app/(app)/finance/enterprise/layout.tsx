import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { FinanceEnterpriseWorkspace } from "@/modules/finance/components/dashboard/FinanceEnterpriseWorkspace";

export default async function FinanceEnterpriseLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  return <FinanceEnterpriseWorkspace>{children}</FinanceEnterpriseWorkspace>;
}
