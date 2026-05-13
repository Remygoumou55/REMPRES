import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminObservabilityGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance observabilité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les enqueues manuels sont journalisés dans <span className="font-medium">governance_audit_events</span>.
        </p>
      </section>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
        <ul className="list-inside list-disc space-y-2">
          <li>
            <Link href="/admin/audit" className="text-sky-800 hover:underline">
              Audit
            </Link>
          </li>
          <li>
            <Link href="/admin/alerts" className="text-sky-800 hover:underline">
              Alertes
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
