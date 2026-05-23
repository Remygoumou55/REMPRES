import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { PageHeader } from "@/components/ui/page-header";
import { assertErpObservabilityReadAccess } from "@/lib/erp-core/observability/security/observability-security";
import { getErpObservabilitySnapshot } from "@/lib/erp-core/observability/runtime/observability-runtime";
import { ErpObservabilityPanels } from "@/app/(app)/erp/observability/ErpObservabilityPanels";

export default async function ErpObservabilityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  let scope;
  try {
    scope = await assertErpObservabilityReadAccess(user.id);
  } catch {
    redirect("/access-denied");
  }

  const snapshot = getErpObservabilitySnapshot(scope);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Observabilité bus ERP"
        subtitle="Visibilité read-only — événements, handlers, notifications, automation (in-process)."
      />
      <ErpObservabilityPanels snapshot={snapshot} />
    </div>
  );
}
