import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { OBSERVABILITY_NAV } from "@/modules/observability/constants/nav";
import { ObservabilityOverviewMetrics } from "@/modules/observability/components/dashboard/ObservabilityOverviewMetrics";
import { getCachedObservabilityHubDigest } from "@/lib/performance/cached-admin-digests";

export default async function AdminObservabilityHubPage() {
  const digest = await getCachedObservabilityHubDigest();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Observability Hub"
        subtitle="Incidents, santé runtime, anomalies et traces — données live plateforme."
        actions={
          <Link
            href="/erp/observability"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Console bus technique
          </Link>
        }
      />
      <ObservabilityOverviewMetrics overview={digest.overview} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OBSERVABILITY_NAV.filter((x) => x.href !== "/admin/observability").map((item) => {
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
    </div>
  );
}
