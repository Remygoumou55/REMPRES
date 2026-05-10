import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceRecoveryPage() {
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
          { href: "/admin/resilience/recovery", label: "Recovery" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Disaster recovery validation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Jeux exercice catégorie <span className="font-medium">recovery</span> reliés aux checkpoints cloud et procédures
          observabilité.
        </p>
        <Link href="/admin/cloud/recovery" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          DR cloud →
        </Link>
      </section>
    </>
  );
}
