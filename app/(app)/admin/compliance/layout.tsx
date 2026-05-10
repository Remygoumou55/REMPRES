import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isComplianceOperator } from "@/lib/server/permissions";
import { ComplianceOperationalWorkspace } from "@/modules/compliance/components/dashboard/ComplianceOperationalWorkspace";

export default async function AdminComplianceLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isComplianceOperator(user.id);

  return <ComplianceOperationalWorkspace canOperate={canOperate}>{children}</ComplianceOperationalWorkspace>;
}
