import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminPlatformSecurityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/platform", label: "Plateforme" },
          { href: "/admin/platform/security", label: "Sécurité" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Sécurité extensions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tier risque catalogue (<span className="font-medium">risk_tier</span>) ; isolation par tenant sur installations et connexions partenaires.
        </p>
        <Link href="/admin/platform/marketplace" className="mt-3 inline-flex text-sm font-medium text-cyan-800 hover:underline">
          Marketplace →
        </Link>
      </section>
    </>
  );
}
