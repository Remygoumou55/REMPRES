import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KpiGridSkeleton } from "@/components/dashboard";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getUserDisplay } from "@/lib/server/get-user-display";
import { DeptDashboardClient } from "./DeptDashboardClient";

export default async function DeptDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { firstName } = await getUserDisplay(user.id, user.email ?? undefined);

  return (
    <Suspense fallback={<KpiGridSkeleton count={4} />}>
      <DeptDashboardClient firstName={firstName} />
    </Suspense>
  );
}
