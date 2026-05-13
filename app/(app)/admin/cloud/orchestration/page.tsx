import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudOrchestrationPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orchestration cloud globale</h1>
        <p className="mt-1 text-sm text-gray-600">
          Coordination des files infrastructure (<span className="font-medium">queue_key cloud</span>) avec digest batch —
          même schéma que multi-tenant / ecosystem sans parallèle d&apos;architecture.
        </p>
        <Link href="/admin/cloud" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Pilotage cloud →
        </Link>
      </section>
    </>
  );
}
