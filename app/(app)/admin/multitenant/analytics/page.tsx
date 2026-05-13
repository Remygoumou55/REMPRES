import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminMultitenantAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Analytics tenant-scoped</h1>
        <p className="mt-1 text-sm text-gray-600">
          Persistance dans <span className="font-medium">erp_tenant_analytics_snapshots</span> (clé{" "}
          <span className="font-medium">tenant_id + scope_key</span>) — le digest RH global reste dans{" "}
          <span className="font-medium">erp_analytics_snapshots</span>.
        </p>
        <Link href="/admin/intelligence" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Intelligence entreprise →
        </Link>
      </section>
    </>
  );
}
