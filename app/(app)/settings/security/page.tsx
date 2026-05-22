import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, ClipboardList, Bell, Users } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

export const metadata = { title: "Sécurité — Paramètres" };

export default async function SettingsSecurityPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  const cards = [
    {
      href: "/admin/activity-logs",
      icon: ClipboardList,
      title: "Connexions & journaux",
      description: "Activité récente, sessions et événements d'authentification (sans secrets techniques).",
    },
    {
      href: "/admin/alerts",
      icon: Bell,
      title: "Alertes sécurité",
      description: "Signaux critiques et activités suspectes remontées par la gouvernance.",
    },
    {
      href: SETTINGS_OFFICIAL_ROUTES.users,
      icon: Users,
      title: "Verrouillage comptes",
      description: "Suspension, réactivation et réinitialisation d'accès utilisateurs.",
    },
  ] as const;

  return (
    <div className="page-wrapper">
      <PageHeader title="Sécurité" subtitle="Supervision des accès — centre gouverné, sans exposition d'infrastructure." />
      <SettingsSectionShell
        title="Centre sécurité ERP"
        subtitle="Sessions, connexions, politique d'accès et verrouillage des comptes. Aucun token, clé API ni variable d'environnement n'est affiché ici."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} aria-hidden />
                </div>
                <p className="text-sm font-semibold text-darktext">{c.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.description}</p>
              </Link>
            );
          })}
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs text-gray-600">
          <Shield size={14} className="mb-1 inline text-primary" aria-hidden /> Politique mots de passe : longueur minimale,
          complexité et flux de réinitialisation gérés via les écrans d&apos;invitation / auth (pas de secrets affichés).
        </div>
      </SettingsSectionShell>
    </div>
  );
}
