import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminPlatformExtensionsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Extensions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Types <span className="font-medium">plugin</span>, <span className="font-medium">integration</span>,{" "}
          <span className="font-medium">workflow_connector</span>, <span className="font-medium">sdk_bundle</span> dans le registre.
        </p>
        <Link href="/admin/platform/marketplace" className="mt-3 inline-flex text-sm font-medium text-cyan-800 hover:underline">
          Catalogue →
        </Link>
      </section>
    </>
  );
}
