import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminEcosystemGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ecosystem", label: "Écosystème" },
          { href: "/admin/ecosystem/governance", label: "Gouvernance" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance écosystème</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mutations catalogue partenaires et certifications réservées aux opérateurs ; audit via{" "}
          <span className="font-medium">governance_audit_events</span>.
        </p>
        <Link href="/admin/audit" className="mt-3 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Audit →
        </Link>
      </section>
    </>
  );
}
