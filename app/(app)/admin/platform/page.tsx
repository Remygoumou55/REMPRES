import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PLATFORM_NAV } from "@/modules/platform/constants/nav";
import { PlatformOverviewMetrics } from "@/modules/platform/components/dashboard/PlatformOverviewMetrics";
import { PlatformObservabilityMetricsPanel } from "@/modules/platform/components/dashboard/PlatformObservabilityMetrics";
import { getCachedPlatformCockpitDigest } from "@/lib/performance/cached-admin-digests";

export default async function AdminPlatformHubPage() {
  const digest = await getCachedPlatformCockpitDigest();

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Platform Cockpit"
        subtitle="API gouvernées, intégrations, connecteurs, marketplace et écosystème développeur."
        actions={
          <Link
            href="/admin/platform-dashboard"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            Console plateforme legacy
          </Link>
        }
      />
      <PlatformOverviewMetrics overview={digest.overview} />
      <PlatformObservabilityMetricsPanel metrics={digest.metrics} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_NAV.filter((x) => x.href !== "/admin/platform").map((item) => {
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
