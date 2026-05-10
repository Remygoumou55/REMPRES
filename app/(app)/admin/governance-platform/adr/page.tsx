import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listGovernanceAdrsBrief } from "@/modules/governance-platform/server/repositories/governance-adr-read-repository";

export default async function AdminGovernancePlatformAdrPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listGovernanceAdrsBrief(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/governance-platform", label: "Gouvernance plateforme" },
          { href: "/admin/governance-platform/adr", label: "ADR" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Architecture Decision Records</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registre <span className="font-medium">erp_governance_architecture_decisions</span> (global ou par tenant).
        </p>
        <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
          {rows.length === 0 ? (
            <li className="p-3 text-gray-500">Aucune ADR (appliquer migration 058).</li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="font-medium text-gray-900">{r.title}</span>
                <span className="text-xs text-gray-600">
                  {r.adr_key} · {r.decision_status}
                </span>
              </li>
            ))
          )}
        </ul>
        <Link href="/admin/governance-platform/architecture" className="mt-4 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Architecture board →
        </Link>
      </section>
    </>
  );
}
