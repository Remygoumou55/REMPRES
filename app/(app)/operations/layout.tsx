import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { OperationsOperationalWorkspace } from "@/modules/operations/components/dashboard/OperationsOperationalWorkspace";

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["operations"]);
  if (!perms.canRead) redirect("/access-denied");

  return <OperationsOperationalWorkspace>{children}</OperationsOperationalWorkspace>;
}
