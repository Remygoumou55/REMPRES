import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Intelligence régionale</h1>
        <p className="mt-1 text-sm text-gray-600">
          Agrégations régionales et corrélations jobs digest — les KPIs métier restent dans analytics domain ; ici le périmètre infra mondiale.
        </p>
        <Link href="/admin/global-dashboard" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Tableau de bord global →
        </Link>
      </section>
    </>
  );
}
