import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAiObservabilityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Corrélations observabilité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Le pipeline <span className="font-medium">ai.insight_pipeline</span> lit les snapshots santé globaux et les
          anomalies pour produire insights et séries prévisionnelles.
        </p>
        <Link href="/admin/observability" className="mt-3 inline-flex text-sm font-medium text-violet-800 hover:underline">
          Ouvrir observabilité →
        </Link>
      </section>
    </>
  );
}
