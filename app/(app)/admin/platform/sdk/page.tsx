import { PageHeader } from "@/components/ui/page-header";
import { DeveloperEcosystemGuide } from "@/modules/platform/components/sdk/DeveloperEcosystemGuide";

export default function AdminPlatformSdkPage() {
  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="SDK & développeurs" subtitle="Onboarding, sandbox et guides d'intégration." />
      <DeveloperEcosystemGuide />
    </div>
  );
}
