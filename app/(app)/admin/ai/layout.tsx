import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions, isAiOperator } from "@/lib/server/permissions";
import { AiOperationalWorkspace } from "@/modules/ai/components/dashboard/AiOperationalWorkspace";

export default async function AdminAiLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const canOperate = await isAiOperator(user.id);

  return <AiOperationalWorkspace canOperate={canOperate}>{children}</AiOperationalWorkspace>;
}
