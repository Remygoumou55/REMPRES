import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceAiPage() {
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
          { href: "/admin/resilience/ai", label: "IA" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">AI workload validation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scénarios catégorie <span className="font-medium">ai</span> complémentaires aux jobs{" "}
          <span className="font-medium">ai.*</span> — pas de second pipeline inférence.
        </p>
        <Link href="/admin/ai" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Console IA →
        </Link>
      </section>
    </>
  );
}
