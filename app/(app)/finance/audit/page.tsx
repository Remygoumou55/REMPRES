import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Landmark, Scale } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AUDIT_CARDS = [
  {
    title: "Rapprochements bancaires",
    href: "/finance/rapprochement",
    description:
      "Vérifier les écarts entre le système et le relevé bancaire",
    icon: Landmark,
  },
  {
    title: "Historique des transactions",
    href: "/finance",
    description: "Consulter toutes les transactions en détail",
    icon: ArrowLeftRight,
  },
  {
    title: "Bilans mensuels",
    href: "/finance/bilans",
    description: "Vérifier les bilans générés",
    icon: Scale,
  },
] as const;

export default async function FinanceAuditPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Audit interne"
        subtitle="Contrôle et vérification financière"
        breadcrumbs={
          <Link
            href="/finance"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour Finance
          </Link>
        }
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        L&apos;audit interne est désormais intégré dans le module Finance. Toutes les
        fonctionnalités de contrôle sont accessibles depuis ce tableau.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-primary">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
