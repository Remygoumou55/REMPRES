import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFinanceVisualRead } from "@/modules/department-dashboards/finance/server";
import { FinanceVisualPageClient } from "./FinanceVisualPageClient";

export const metadata = {
  title: "Finance Visual Operations Center",
};

export default async function FinanceVisualPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertFinanceVisualRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  return <FinanceVisualPageClient />;
}
