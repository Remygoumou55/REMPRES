/**
 * Bloc 3 — KPI runtime consultation / operations (données live).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";
import { buildOpsOperationalAnalytics } from "@/modules/operations/server/services/ops-analytics-service";

export const OPERATIONS_RUNTIME_KPI_SOURCE = "operations-runtime-kpi-bundle-v1" as const;

export async function buildDeptConsultationKpiPayload(
  supabase: SupabaseClient<Database>,
  _userId: string,
  now = new Date(),
): Promise<DeptKpiPayload> {
  const [overview, analytics] = await Promise.all([
    getOperationsOperationalOverview(supabase),
    buildOpsOperationalAnalytics(supabase),
  ]);

  const alerts =
    overview.delayedDeliveries > 0
      ? [
          {
            id: "delivery_delayed",
            level: "warning" as const,
            message: "dashboard.dept.alert.deliveryDelayed",
          },
        ]
      : overview.blockedTasks > 0
        ? [
            {
              id: "tasks_blocked",
              level: "warning" as const,
              message: "dashboard.dept.alert.tasksBlocked",
            },
          ]
        : overview.openTasks > 5
          ? [
              {
                id: "task_backlog",
                level: "info" as const,
                message: "dashboard.dept.alert.taskBacklog",
              },
            ]
          : [];

  return {
    stats: [
      {
        id: "openTasks",
        label: "dashboard.dept.kpi.openTasks",
        value: overview.openTasks,
        unit: "count",
      },
      {
        id: "activeProjects",
        label: "dashboard.dept.kpi.activeProjects",
        value: overview.activeProjects,
        unit: "count",
      },
      {
        id: "activeWorkflows",
        label: "dashboard.dept.kpi.activeWorkflows",
        value: overview.activeWorkflows,
        unit: "count",
      },
      {
        id: "deliveryRate",
        label: "dashboard.dept.kpi.deliveryRate",
        value: overview.completionRatePct,
        unit: "percent",
      },
      {
        id: "tasksDoneMonth",
        label: "dashboard.dept.kpi.tasksDoneMonth",
        value: analytics.tasks.doneThisMonth,
        unit: "count",
      },
    ],
    charts: [],
    alerts,
    activity: [],
    health: { status: "ok" },
    metadata: {
      source: OPERATIONS_RUNTIME_KPI_SOURCE,
      generatedAt: now.toISOString(),
      placeholder: false,
    },
  };
}
