import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { assertSuperAdminArchivesAdmin } from "@/lib/server/archives";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Exports — Admin",
};

const EXPORT_LINKS = [
  { label: "Clients (Vente)", href: "/vente/clients" },
  { label: "Produits (Vente)", href: "/vente/produits" },
  { label: "Historique ventes", href: "/vente/historique" },
  { label: "Finance — Dépenses", href: "/finance/depenses" },
  { label: "Journal d'activité", href: "/admin/activity-logs/export" },
];

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
        subtitle="Accès aux exports disponibles depuis chaque module métier."
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Fonctionnalité d&apos;export disponible depuis chaque module (clients, ventes, finance…).
          Utilisez les liens ci-dessous pour accéder aux écrans contenant les actions d&apos;export.
        </p>
        <ul className="mt-6 space-y-3">
          {EXPORT_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                {item.label} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
