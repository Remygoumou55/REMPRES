import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAiRiskPage() {
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
          { href: "/admin/ai/risk", label: "Risque AI" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Risque prédictif</h1>
        <p className="mt-1 text-sm text-gray-600">
          Croisement signaux AI avec conformité et observabilité — sources natives sans duplication.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/admin/compliance" className="text-violet-800 hover:underline">
              Conformité
            </Link>
          </li>
          <li>
            <Link href="/admin/observability/correlations" className="text-violet-800 hover:underline">
              Corrélations observabilité
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance/risks" className="text-violet-800 hover:underline">
              Risques conformité
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
