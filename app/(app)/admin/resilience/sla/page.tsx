import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceSlaPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">SLA validation & stability scoring</h1>
        <p className="mt-1 text-sm text-gray-600">
          Points de mesure dans <span className="font-medium">erp_resilience_metric_snapshots</span> ; SLA métier tenant
          inchangés (<span className="font-medium">erp_tenant_sla_policies</span>).
        </p>
        <Link href="/admin/multitenant/sla" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          SLA multitenant →
        </Link>
      </section>
    </>
  );
}
