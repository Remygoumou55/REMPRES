import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudObservabilityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Mesh observabilité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vue transverse santé multi-région ; incidents métier et traces détaillées restent dans le module observabilité verrouillé.
        </p>
        <Link href="/admin/observability" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Observabilité ERP →
        </Link>
      </section>
    </>
  );
}
