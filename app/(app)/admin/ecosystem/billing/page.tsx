import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminEcosystemBillingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Billing partenaires</h1>
        <p className="mt-1 text-sm text-gray-600">
          Références revenue-share ou abonnements connecteurs peuvent pointer vers{" "}
          <span className="font-medium">erp_tenant_billing_accounts</span> — pas de sous-ledger obligatoire ici.
        </p>
        <Link href="/admin/multitenant/billing" className="mt-3 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Billing tenant →
        </Link>
      </section>
    </>
  );
}
