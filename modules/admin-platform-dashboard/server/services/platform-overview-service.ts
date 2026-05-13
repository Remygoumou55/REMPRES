import { buildAdminPlatformOverviewModel } from "../../core/platform-overview";
import type { AdminPlatformOverviewModel } from "../../types/domain";
import { getAdminPlatformAggregates } from "../repositories";
import { validateAdminPlatformAggregates } from "../validators";

export async function getAdminPlatformOverviewModel(args: {
  viewerUserId: string;
  elevated: boolean;
}): Promise<AdminPlatformOverviewModel> {
  const aggregates = validateAdminPlatformAggregates(await getAdminPlatformAggregates(args));
  return buildAdminPlatformOverviewModel({
    metrics: [
      { id: "jobsPending", labelKey: "admin.platformDashboard.metric.jobsPending", value: aggregates.jobsPending, unit: "count" },
      { id: "jobsFailed24h", labelKey: "admin.platformDashboard.metric.jobsFailed24h", value: aggregates.jobsFailed24h, unit: "count" },
      { id: "incidentsOpen", labelKey: "admin.platformDashboard.metric.incidentsOpen", value: aggregates.incidentsOpen, unit: "count" },
      { id: "anomaliesOpen", labelKey: "admin.platformDashboard.metric.anomaliesOpen", value: aggregates.anomaliesOpen, unit: "count" },
      { id: "riskSignalsOpen", labelKey: "admin.platformDashboard.metric.riskSignalsOpen", value: aggregates.riskSignalsOpen, unit: "count" },
      { id: "tenantsActive", labelKey: "admin.platformDashboard.metric.tenantsActive", value: aggregates.tenantsActive, unit: "count" },
      { id: "tenantSnapshots", labelKey: "admin.platformDashboard.metric.tenantSnapshots", value: aggregates.tenantSnapshots, unit: "count" },
    ],
    tenantScope: args.elevated ? "global" : "scoped",
  });
}
