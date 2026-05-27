import { PageHeader } from "@/components/ui/page-header";
import { ConnectorsPageClient } from "@/components/platform/ConnectorsPageClient";
import { listConnectors } from "@/lib/server/platform";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlatformConnectorsPage() {
  const result = await listConnectors();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Connecteurs"
        subtitle="Integrations avec services tiers"
      />
      <ConnectorsPageClient connectors={result.data} />
    </div>
  );
}
