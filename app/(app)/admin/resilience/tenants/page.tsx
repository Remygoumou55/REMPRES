import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceTenantsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Tenant resilience validation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Runs peuvent être scopés par <span className="font-medium">tenant_id</span> ; isolation alignée sur{" "}
          <span className="font-medium">user_can_access_tenant</span>.
        </p>
        <Link href="/admin/multitenant/tenants" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Tenants SaaS →
        </Link>
      </section>
    </>
  );
}
