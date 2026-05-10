import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isResilienceOperator } from "@/lib/server/permissions";
import { ResilienceOperationalWorkspace } from "@/modules/resilience/components/dashboard/ResilienceOperationalWorkspace";

export default async function AdminResilienceLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isResilienceOperator(user.id);

  return <ResilienceOperationalWorkspace canOperate={canOperate}>{children}</ResilienceOperationalWorkspace>;
}
