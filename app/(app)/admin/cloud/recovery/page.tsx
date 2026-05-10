import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudRecoveryPage() {
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
          { href: "/admin/cloud/recovery", label: "Disaster recovery" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Disaster recovery multi-région</h1>
        <p className="mt-1 text-sm text-gray-600">
          Checkpoints <span className="font-medium">erp_cloud_recovery_checkpoints</span> par tenant et région ;
          orchestration métier incident inchangée côté observabilité / multitenant recovery.
        </p>
        <Link href="/admin/multitenant/recovery" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Recovery multitenant →
        </Link>
      </section>
    </>
  );
}
