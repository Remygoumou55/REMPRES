import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudAiPage() {
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
          { href: "/admin/cloud/ai", label: "IA distribuée" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">IA opérationnelle distribuée</h1>
        <p className="mt-1 text-sm text-gray-600">
          Orchestration pipelines IA par région sans second moteur : files <span className="font-medium">ai.*</span> inchangées ; digest cloud peut corréler latence / charge.
        </p>
        <Link href="/admin/ai" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Console IA →
        </Link>
      </section>
    </>
  );
}
