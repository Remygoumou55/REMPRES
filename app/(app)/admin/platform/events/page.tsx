import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminPlatformEventsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/platform", label: "Plateforme" },
          { href: "/admin/platform/events", label: "Événements" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Routage événements externes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Outbox append-only : <span className="font-medium">erp_platform_external_event_outbox</span> avec{" "}
          <span className="font-medium">topic_key</span> et charge utile JSON — dispatch workers sans nouveau bus parallèle.
        </p>
        <Link href="/admin/global-dashboard" className="mt-3 inline-flex text-sm font-medium text-cyan-800 hover:underline">
          Infrastructure →
        </Link>
      </section>
    </>
  );
}
