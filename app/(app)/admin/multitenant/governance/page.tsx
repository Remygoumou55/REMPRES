import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminMultitenantGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance tenant-aware</h1>
        <p className="mt-1 text-sm text-gray-600">
          Audit via <span className="font-medium">governance_audit_events</span> sur les actions d&apos;orchestration — même bus que le socle.
        </p>
        <Link href="/admin/audit" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Audit →
        </Link>
      </section>
    </>
  );
}
