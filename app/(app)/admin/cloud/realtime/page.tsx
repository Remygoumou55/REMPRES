import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudRealtimePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Fédération temps réel</h1>
        <p className="mt-1 text-sm text-gray-600">
          Alignement conceptuel avec la fédération ecosystem / bus existants — pas de second canal realtime ; extensions via événements et permissions cloud.
        </p>
        <Link href="/admin/ecosystem/federation" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Fédération écosystème →
        </Link>
      </section>
    </>
  );
}
