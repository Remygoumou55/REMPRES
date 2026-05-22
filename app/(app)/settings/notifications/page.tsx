import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckSquare, Shield } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export const metadata = { title: "Notifications — Paramètres" };

export default async function SettingsNotificationsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader title="Notifications" subtitle="Alertes système, validations et événements importants — canal centralisé." />
      <SettingsSectionShell
        title="Centre notifications ERP"
        subtitle="Les notifications métier opérationnelles restent dans leurs modules ; ici, la gouvernance transverse."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Link
              href="/admin/alerts"
              className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary/20"
            >
              <Bell className="shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold">Alertes système</p>
                <p className="text-xs text-gray-500">File gouvernance — criticité et lecture.</p>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/approvals"
              className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary/20"
            >
              <CheckSquare className="shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold">Validations critiques</p>
                <p className="text-xs text-gray-500">Décisions sensibles en attente.</p>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/activity-logs"
              className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-primary/20"
            >
              <Shield className="shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold">Événements sécurité</p>
                <p className="text-xs text-gray-500">Journaux applicatifs filtrables.</p>
              </div>
            </Link>
          </li>
        </ul>
      </SettingsSectionShell>
    </div>
  );
}
