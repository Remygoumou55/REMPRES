import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <DashboardClient email={data.user.email ?? null} />;
}
