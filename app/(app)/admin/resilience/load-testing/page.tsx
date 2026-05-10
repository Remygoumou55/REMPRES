import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceLoadTestingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/resilience", label: "Résilience" },
          { href: "/admin/resilience/load-testing", label: "Charge" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Load testing distribué</h1>
        <p className="mt-1 text-sm text-gray-600">
          Profils catégorie <span className="font-medium">load</span> ; orchestration externe branchée sur digest jobs —
          pas de générateur HTTP dans le runtime App Router.
        </p>
        <Link href="/admin/resilience/queues" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Stress files →
        </Link>
      </section>
    </>
  );
}
