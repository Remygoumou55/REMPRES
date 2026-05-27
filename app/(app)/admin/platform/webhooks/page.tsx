import { PageHeader } from "@/components/ui/page-header";
import { WebhooksPageClient } from "@/components/platform/WebhooksPageClient";
import { listWebhooks } from "@/lib/server/webhooks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlatformWebhooksPage() {
  const result = await listWebhooks();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Webhooks"
        subtitle="Intégrations entrantes et sortantes"
      />
      <WebhooksPageClient
        webhooks={result.data}
        incomingCount={result.incoming_count}
        outgoingCount={result.outgoing_count}
      />
    </div>
  );
}
