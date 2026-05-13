import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAiOptimizationPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Optimisation workflows</h1>
        <p className="mt-1 text-sm text-gray-600">
          Intelligence de rebalancement branchée sur le moteur automation existant — pas de second orchestrateur.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/admin/automation" className="text-violet-800 hover:underline">
              Console automation
            </Link>
          </li>
          <li>
            <Link href="/admin/approvals" className="text-violet-800 hover:underline">
              Approbations
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
