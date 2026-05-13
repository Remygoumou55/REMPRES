import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminMultitenantRegionsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Régions & scaling</h1>
        <p className="mt-1 text-sm text-gray-600">
          Champ <span className="font-medium">region_key</span> sur chaque tenant ; une expansion multi-région peut mapper ce champ vers des routes et stockage sans refactor du runtime Next.
        </p>
        <Link href="/admin/multitenant/tenants" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Tenants →
        </Link>
      </section>
    </>
  );
}
