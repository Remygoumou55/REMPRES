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

