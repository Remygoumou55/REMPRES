import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCrmVisualRead } from "@/modules/department-dashboards/crm/server";
import { CrmVisualPageClient } from "./CrmVisualPageClient";

export const metadata = {
  title: "Sales & Customer Operations Center",
};

export default async function CrmVisualPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertCrmVisualRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  return <CrmVisualPageClient />;
}
