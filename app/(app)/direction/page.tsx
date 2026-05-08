import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingUp, ArrowRight } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/lib/constants/routes";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export default async function DirectionPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title={NAV_LABELS.direction}
        subtitle="Pilotage stratégique et supervision globale"
        actions={
          <Link
            href={ROUTES.actions}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Voir les Actions <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="section-title">Vision exécutive</h2>
          <p className="text-sm text-gray-600">
            Cette page rassemble les indicateurs stratégiques de Direction sans les modules opérationnels.
          </p>
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-darktext">Accès rapide</p>
              <p className="text-sm text-gray-500">Approbations, alertes et audit centralisés dans Actions.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

