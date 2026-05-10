import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminEcosystemWorkflowsPage() {
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
          { href: "/admin/ecosystem/workflows", label: "Workflows" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orchestration fédérée</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les runs restent dans <span className="font-medium">automation</span> ; les connecteurs « workflow_connector » du marketplace peuvent publier des événements vers l&apos;outbox.
        </p>
        <Link href="/admin/automation" className="mt-3 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Automation →
        </Link>
      </section>
    </>
  );
}
