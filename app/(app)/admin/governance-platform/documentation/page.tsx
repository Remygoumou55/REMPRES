import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformDocumentationPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/governance-platform", label: "Gouvernance plateforme" },
          { href: "/admin/governance-platform/documentation", label: "Documentation" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Documentation plateforme</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les traces historiques d&apos;actions sensibles restent dans{" "}
          <span className="font-medium">governance_audit_events</span> ; ce module centralise les artefacts ADR /
          standards sans second wiki interne.
        </p>
        <Link href="/admin/compliance/governance" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Conformité — gouvernance →
        </Link>
      </section>
    </>
  );
}
