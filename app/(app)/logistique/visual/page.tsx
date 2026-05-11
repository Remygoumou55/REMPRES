import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogisticsVisualRead } from "@/modules/department-dashboards/logistics/server";
import { LogisticsVisualPageClient } from "./LogisticsVisualPageClient";

export const metadata = {
  title: "Supply Chain Operations Center",
};

export default async function LogisticsVisualPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertLogisticsVisualRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  return <LogisticsVisualPageClient />;
}
