import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAiGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ai", label: "AI" },
          { href: "/admin/ai/governance", label: "Gouvernance" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance & sécurité AI</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enqueues pipelines journalisés ; événements assistant auditables ; pas d&apos;appel LLM obligatoire dans le
          socle.
        </p>
        <Link href="/admin/audit" className="mt-3 inline-flex text-sm font-medium text-violet-800 hover:underline">
          Audit →
        </Link>
      </section>
    </>
  );
}
