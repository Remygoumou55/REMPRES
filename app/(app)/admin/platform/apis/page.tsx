import { PageHeader } from "@/components/ui/page-header";
import { ApisPageClient } from "@/components/platform/ApisPageClient";
import { listApis } from "@/lib/server/platform";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlatformApisPage() {
  const result = await listApis();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Registre des APIs"
        subtitle="APIs internes et integrations externes"
      />
      <ApisPageClient apis={result.data} activeCount={result.active_count} />
    </div>
  );
}
