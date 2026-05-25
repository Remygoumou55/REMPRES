import { PageHeader } from "@/components/ui/page-header";
import { PlatformApiGovernancePanel } from "@/modules/platform/components/governance/PlatformApiGovernancePanel";
import { ERP_EVENT_CATALOG_VERSION, listPlatformGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { PLATFORM_DOMAIN_GOVERNANCE_VERSION } from "@/lib/platform/governance/platform-domain-governance";

export default function AdminPlatformGovernancePage() {
  const events = listPlatformGovernanceEvents();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Gouvernance plateforme"
        subtitle={`${PLATFORM_DOMAIN_GOVERNANCE_VERSION} — catalogue ${ERP_EVENT_CATALOG_VERSION}.`}
      />
      <PlatformApiGovernancePanel />
      <ul className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs">
        {events.map((e) => (
          <li key={e.type}>
            {e.type} — {e.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
