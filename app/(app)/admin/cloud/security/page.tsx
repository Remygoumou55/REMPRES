import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudSecurityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/cloud", label: "Cloud mondial" },
          { href: "/admin/cloud/security", label: "Sécurité fédération" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Sécurité fédération cloud</h1>
        <p className="mt-1 text-sm text-gray-600">
          Permissions module <span className="font-medium">cloud</span>, fonctions <span className="font-medium">is_cloud_operator</span> /{" "}
          <span className="font-medium">user_has_cloud_module_permission</span> — complète ecosystem / platform sans réécrire l&apos;auth.
        </p>
        <Link href="/admin/ecosystem/security" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Sécurité écosystème →
        </Link>
      </section>
    </>
  );
}
