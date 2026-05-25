// cache-bust: 24-05-2026
import { notFound, redirect } from "next/navigation";
import { DeptHomePage } from "@/components/dashboard/dept-home-page";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getDeptDashboardData, type DeptKey } from "@/lib/server/dept-dashboard";
import { getUserDisplay } from "@/lib/server/get-user-display";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_SLUGS = new Set<string>(DEPARTMENTS.map((d) => d.key));

type PageProps = {
  params: { deptKey: string };
};

export default async function DeptDashboardPage({ params }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const rawKey = String(params.deptKey ?? "").trim().toLowerCase();
  if (rawKey === "consultation") {
    redirect("/dept/formation");
  }

  const deptKey = rawKey as DeptKey;
  if (!VALID_SLUGS.has(rawKey)) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const [{ firstName }, data] = await Promise.all([
    getUserDisplay(user.id, user.email ?? undefined),
    getDeptDashboardData(supabase, deptKey, user.id),
  ]);

  return <DeptHomePage data={data} firstName={firstName} />;
}
