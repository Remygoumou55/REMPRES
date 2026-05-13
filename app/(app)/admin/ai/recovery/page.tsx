import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAiRecoveryPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Récupération prédictive</h1>
        <p className="mt-1 text-sm text-gray-600">
          Orientations issues des pipelines AI (santé, files d&apos;attente, risques) — sans paralléliser le moteur
          d&apos;incidents existant.
        </p>
        <Link href="/admin/observability/incidents" className="mt-3 inline-flex text-sm font-medium text-violet-800 hover:underline">
          Incidents observabilité →
        </Link>
      </section>
    </>
  );
}
