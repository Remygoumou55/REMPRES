import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Automated governance validation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scénarios catégorie <span className="font-medium">governance</span> pour contrôler alignement ADR / standards
          sans fusionner avec la console maturité.
        </p>
        <Link href="/admin/governance-platform/adr" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          ADR plateforme →
        </Link>
      </section>
    </>
  );
}
