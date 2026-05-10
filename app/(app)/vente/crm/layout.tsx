import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { CrmOperationalWorkspace } from "@/modules/crm/components/dashboard/CrmOperationalWorkspace";

export default async function VenteCrmLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["crm", "vente"]);
  if (!perms.canRead) redirect("/access-denied");

  return <CrmOperationalWorkspace>{children}</CrmOperationalWorkspace>;
}
