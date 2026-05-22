import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { appConfig } from "@/lib/config";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export const metadata = { title: "Système — Paramètres" };

export default async function SettingsSystemPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  const rows = [
    { label: "Application", value: appConfig.name },
    { label: "Version ERP", value: appConfig.version },
    { label: "Pays", value: appConfig.country },
    { label: "État", value: "Opérationnel" },
  ];

  return (
    <div className="page-wrapper">
      <PageHeader title="Système" subtitle="Santé plateforme et maintenance — sans panneau développeur." />
      <SettingsSectionShell
        title="Centre système ERP"
        subtitle="Supervision de la plateforme : statut, version et liens vers l'activité système gouvernée."
      >
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{r.label}</td>
                  <td className="px-4 py-3 font-medium text-darktext">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/platform-dashboard"
            className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-primary hover:bg-gray-50"
          >
            Activité système (supervision)
          </Link>
          <Link
            href="/admin/compliance"
            className="rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Conformité &amp; rétention
          </Link>
        </div>
        <p className="text-xs text-gray-500">
          Les journaux bruts, stack traces et variables d&apos;environnement ne sont pas exposés depuis ce centre.
        </p>
      </SettingsSectionShell>
    </div>
  );
}
