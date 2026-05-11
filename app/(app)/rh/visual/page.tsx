import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertHrVisualRead } from "@/modules/department-dashboards/hr/server";
import { RhVisualPageClient } from "./RhVisualPageClient";

export const metadata = {
  title: "RH Visual Enterprise",
};

export default async function RhVisualPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  try {
    await assertHrVisualRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  return <RhVisualPageClient />;
}
