import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";

export default async function ConfigPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader title="Configuration" subtitle="Paramètres système" />

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <h2 className="font-semibold text-darktext">Paramètres</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Gestion des paramètres opérationnels et de change.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/settings" className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Ouvrir les paramètres utilisateur
          </Link>
          <Link href="/admin/currency" className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Ouvrir les taux de change
          </Link>
        </div>
      </section>
    </div>
  );
}

