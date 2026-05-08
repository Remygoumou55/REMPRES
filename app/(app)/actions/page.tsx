import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";

const ActionsPageClient = dynamic(() => import("./ActionsPageClient").then((m) => m.ActionsPageClient), {
  ssr: false,
});

export default async function ActionsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Actions"
        subtitle="Approbations, alertes et audit"
      />
      <ActionsPageClient />
    </div>
  );
}

