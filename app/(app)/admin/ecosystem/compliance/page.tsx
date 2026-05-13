import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminEcosystemCompliancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Conformité écosystème</h1>
        <p className="mt-1 text-sm text-gray-600">
          Alignement avec le moteur conformité existant ; certifications partenaires comme preuve d&apos;homologation.
        </p>
        <Link href="/admin/compliance" className="mt-3 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Conformité →
        </Link>
      </section>
    </>
  );
}
