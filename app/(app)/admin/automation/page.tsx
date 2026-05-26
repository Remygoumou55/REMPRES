import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { AUTOMATION_NAV } from "@/modules/automation/constants/nav";
import { AutomationOverviewMetrics } from "@/modules/automation/components/dashboard/AutomationOverviewMetrics";
import { AutomationObservabilityMetricsPanel } from "@/modules/automation/components/dashboard/AutomationObservabilityMetrics";
import { AutomationTracePanel } from "@/modules/automation/components/dashboard/AutomationTracePanel";
import { getCachedAutomationCockpitDigest } from "@/lib/performance/cached-admin-digests";

export default async function AdminAutomationHubPage() {
  const digest = await getCachedAutomationCockpitDigest();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Automation Cockpit"
        subtitle="Moteur workflow, règles gouvernées, triggers cross-domain et AI decision support."
        actions={
          <Link
            href="/erp/events"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Console bus événements
          </Link>
        }
      />
      <AutomationOverviewMetrics overview={digest.overview} />
      <AutomationObservabilityMetricsPanel metrics={digest.metrics} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AUTOMATION_NAV.filter((x) => x.href !== "/admin/automation").map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="card flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-indigo-300"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Exécutions récentes (ring buffer)</h2>
        <AutomationTracePanel traces={digest.recentTraces} />
      </section>
    </div>
  );
}
