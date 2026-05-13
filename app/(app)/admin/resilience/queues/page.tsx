import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceQueuesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Queue & orchestration stress</h1>
        <p className="mt-1 text-sm text-gray-600">
          Stress sur <span className="font-medium">erp_infrastructure_jobs</span> via scénarios{" "}
          <span className="font-medium">queue</span> / <span className="font-medium">orchestration</span> — jobs métiers
          existants non dupliqués.
        </p>
        <Link href="/admin/multitenant/queues" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Files multitenant →
        </Link>
      </section>
    </>
  );
}
