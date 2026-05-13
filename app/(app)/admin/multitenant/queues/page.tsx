import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";

export default async function AdminMultitenantQueuesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Files orchestrées</h1>
        <p className="mt-1 text-sm text-gray-600">
          Queue dédiée <code className="rounded bg-gray-100 px-1">{INFRA_QUEUE_KEYS.multitenant}</code> sur{" "}
          <span className="font-medium">erp_infrastructure_jobs</span> avec colonne optionnelle{" "}
          <span className="font-medium">tenant_id</span>.
        </p>
        <Link href="/admin/global-dashboard" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Infrastructure →
        </Link>
      </section>
    </>
  );
}
