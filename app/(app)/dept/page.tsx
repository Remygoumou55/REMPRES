import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { DeptCard } from "@/components/dept/dept-card";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DeptPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { messages } = await loadLocaleMessages(getRequestLocale());
  const t = (key: string, fallback?: string) => translateFromDict(messages, key, fallback);

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t("navigation.short.supervision", "Departements")}
        subtitle={t("dashboard.dept.selectDepartment", "Selectionnez un departement")}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEPARTMENTS.map((department) => (
          <DeptCard key={department.key} departmentKey={department.key} />
        ))}
      </div>
    </div>
  );
}

