import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/lib/constants/routes";

export default async function AdminIndexPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  const linkClass = "mt-4 inline-flex text-sm font-semibold text-primary hover:underline";

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Administration"
        subtitle="Consoles opérateur : supervision plateforme, conformité, utilisateurs et configuration."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Intelligence décisionnelle</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Indicateurs prédictifs, recommandations et scénarios d&apos;aide à la décision.
          </p>
          <Link href="/admin/ai" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Standards & gouvernance</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Référentiels, politiques et contrôles transverses pour une exploitation homogène.
          </p>
          <Link href="/admin/governance-platform" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Résilience & continuité</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Plans de reprise, tests de charge et indicateurs de disponibilité.
          </p>
          <Link href="/admin/resilience" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cloud & régions</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Paramètres d&apos;hébergement, répartition géographique et stratégie de reprise.
          </p>
          <Link href="/admin/cloud" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Multi-tenant</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Tenants, quotas et isolation des données entre organisations.
          </p>
          <Link href="/admin/multitenant" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plateforme & intégrations</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Extensions, catalogue d&apos;intégrations et connecteurs métiers.
          </p>
          <Link href="/admin/platform" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Écosystème partenaires</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Partenaires certifiés, connexions supervisées et journal des échanges.
          </p>
          <Link href="/admin/ecosystem" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Observabilité & risques</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Santé des services, anomalies, incidents et pistes d&apos;audit.
          </p>
          <Link href="/admin/observability" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Conformité</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Verrouillage fiscal, périodes comptables, rétention et contrôles légaux.
          </p>
          <Link href="/admin/compliance" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Centre de pilotage</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Synthèse des files, observabilité, cloud et résilience pour les équipes IT.
          </p>
          <Link href={ROUTES.adminPlatformDashboard} className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Automatisation</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Workflows métiers, planifications et orchestrations supervisées.
          </p>
          <Link href="/admin/automation" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Utilisateurs</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">Invitations, rôles et droits d&apos;accès.</p>
          <Link href="/admin/users" className={linkClass}>
            Accéder
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Configuration système</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Paramètres centraux de l&apos;application (module Configuration).
          </p>
          <Link href={ROUTES.config} className={linkClass}>
            Accéder à la configuration
          </Link>
        </section>
      </div>
    </div>
  );
}
