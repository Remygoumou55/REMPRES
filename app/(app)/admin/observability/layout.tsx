import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isObservabilityOperator } from "@/lib/server/permissions";
import { ObservabilityOperationalWorkspace } from "@/modules/observability/components/dashboard/ObservabilityOperationalWorkspace";

export default async function AdminObservabilityLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isObservabilityOperator(user.id);

  return (
    <ObservabilityOperationalWorkspace canOperate={canOperate}>{children}</ObservabilityOperationalWorkspace>
  );
}
