import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceReliabilityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Reliability intelligence</h1>
        <p className="mt-1 text-sm text-gray-600">
          Synthèse via digest <span className="font-medium">resilience.reliability_digest</span> et métriques{" "}
          <span className="font-medium">erp_resilience_metric_snapshots</span>.
        </p>
        <Link href="/admin/resilience" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Pilotage →
        </Link>
      </section>
    </>
  );
}
