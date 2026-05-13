import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminMultitenantSlaPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">SLA & quotas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tables <span className="font-medium">erp_tenant_quotas</span> et{" "}
          <span className="font-medium">erp_tenant_sla_policies</span> — moteur d&apos;application des quotas à brancher sur enqueue sans casser les workers.
        </p>
        <Link href="/admin/multitenant/queues" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Files →
        </Link>
      </section>
    </>
  );
}
