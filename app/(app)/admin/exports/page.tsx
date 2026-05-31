import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Package,
  Receipt,
  History,
  ScrollText,
  ArrowRight,
  FileDown,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { assertSuperAdminArchivesAdmin } from "@/lib/server/archives";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Exports — Admin",
};

const EXPORT_DESTINATIONS = [
  {
    label: "Clients (Vente)",
    href: "/admin/exports/clients",
    description: "Base clients active — contacts, entreprises et dates de création.",
    icon: Users,
    tone: "blue" as const,
  },
  {
    label: "Produits (Vente)",
    href: "/admin/exports/produits",
    description: "Catalogue produits — références, prix, stock et unités.",
    icon: Package,
    tone: "teal" as const,
  },
  {
    label: "Finance — Dépenses",
    href: "/admin/exports/depenses",
    description: "Dépenses par période — montants, catégories et modes de paiement.",
    icon: Receipt,
    tone: "orange" as const,
  },
  {
    label: "Historique ventes",
    href: "/vente/historique",
    description: "Consultation des ventes enregistrées avec export depuis l'écran métier.",
    icon: History,
    tone: "purple" as const,
  },
  {
    label: "Journal d'activité",
    href: "/admin/activity-logs/export",
    description: "Téléchargement CSV du journal d'audit et des actions système.",
    icon: ScrollText,
    tone: "slate" as const,
  },
] as const;

const TONE_STYLES = {
  blue: { iconBg: "bg-blue-50", iconColor: "text-blue-600", border: "hover:border-blue-200" },
  teal: { iconBg: "bg-teal-50", iconColor: "text-teal-600", border: "hover:border-teal-200" },
  orange: { iconBg: "bg-orange-50", iconColor: "text-orange-600", border: "hover:border-orange-200" },
  purple: { iconBg: "bg-violet-50", iconColor: "text-violet-600", border: "hover:border-violet-200" },
  slate: { iconBg: "bg-gray-100", iconColor: "text-gray-600", border: "hover:border-gray-300" },
};

export default async function AdminExportsPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertSuperAdminArchivesAdmin(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Exports"
        subtitle="Téléchargez vos données métier en Excel ou PDF — sans quitter l'espace gouvernance."
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
        <FileDown className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm leading-relaxed text-gray-700">
          En tant que super administrateur, vous accédez ici aux exports en lecture seule.
          Les écrans opérationnels (saisie vente, création client…) restent réservés aux équipes métier.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPORT_DESTINATIONS.map((item) => {
          const Icon = item.icon;
          const tone = TONE_STYLES[item.tone];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition ${tone.border} hover:shadow-md`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${tone.iconColor}`} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-primary">{item.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
              </div>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
