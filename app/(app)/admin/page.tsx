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

  return (
    <div className="page-wrapper">
      <PageHeader title="Admin" subtitle="Administration et gestion système" />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">AI & prédictif</h2>
          <p className="mt-1 text-sm text-gray-600">
            Insights, recommandations et forecasting branchés sur l&apos;observabilité.
          </p>
          <Link href="/admin/ai" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Gouvernance plateforme</h2>
          <p className="mt-1 text-sm text-gray-600">
            ADR, standards, dette technique et maturité — reliés tenants, conformité et observabilité sans refactor global.
          </p>
          <Link
            href="/admin/governance-platform"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Résilience & tests</h2>
          <p className="mt-1 text-sm text-gray-600">
            Chaos, charge, DR et validation SLA — branchés infra jobs, observabilité et cloud sans second orchestrateur.
          </p>
          <Link href="/admin/resilience" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Cloud mondial</h2>
          <p className="mt-1 text-sm text-gray-600">
            Régions catalogue, edge, workloads et DR — branchés tenants, observabilité et IA sans refactor des moteurs
            centraux.
          </p>
          <Link href="/admin/cloud" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Multi-tenant SaaS</h2>
          <p className="mt-1 text-sm text-gray-600">
            Tenants, quotas, files orchestrées et isolation conformité — sans refactor métier.
          </p>
          <Link
            href="/admin/multitenant"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Plateforme & marketplace</h2>
          <p className="mt-1 text-sm text-gray-600">
            Plugins, catalogue marketplace, intégrations partenaires et outbox événements — branché tenants.
          </p>
          <Link href="/admin/platform" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Écosystème partenaires</h2>
          <p className="mt-1 text-sm text-gray-600">
            Fédération partenaires, certifications, routes connecteurs et journal d&apos;événements — branché tenants et marketplace.
          </p>
          <Link href="/admin/ecosystem" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Observabilité & risque</h2>
          <p className="mt-1 text-sm text-gray-600">
            Santé opérationnelle, anomalies, incidents et traces multi-domaines.
          </p>
          <Link
            href="/admin/observability"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Conformité entreprise</h2>
          <p className="mt-1 text-sm text-gray-600">
            Verrous fiscaux, périodes comptables, rétention légale et risques.
          </p>
          <Link
            href="/admin/compliance"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Automation entreprise</h2>
          <p className="mt-1 text-sm text-gray-600">
            Workflows, orchestrations, planifications et bus événements.
          </p>
          <Link
            href="/admin/automation"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Utilisateurs</h2>
          <p className="mt-1 text-sm text-gray-600">Invitations, rôles et permissions.</p>
          <Link href="/admin/users" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Ouvrir →
          </Link>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-darktext">Paramètres → Accéder à Config</h2>
          <p className="mt-1 text-sm text-gray-600">Toutes les configurations sont centralisées dans Config.</p>
          <Link href={ROUTES.config} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Accéder à Config →
          </Link>
        </section>
      </div>
    </div>
  );
}

