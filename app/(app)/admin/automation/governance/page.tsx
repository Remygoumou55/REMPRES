import { PageHeader } from "@/components/ui/page-header";
import { AutomationGovernancePanel } from "@/modules/automation/components/governance/AutomationGovernancePanel";
import { ERP_EVENT_CATALOG_VERSION } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { listAutomationGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";

export default function AdminAutomationGovernancePage() {
  const automationEvents = listAutomationGovernanceEvents();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Gouvernance automation"
        subtitle={`Règles officielles, priorités, cooldown — catalogue ${ERP_EVENT_CATALOG_VERSION}.`}
      />
      <AutomationGovernancePanel />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Événements automation ({automationEvents.length})</h2>
        <ul className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs text-gray-700">
          {automationEvents.map((e) => (
            <li key={e.type}>
              {e.type} — {e.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
