import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import type { RhDeptKpisDigestV1 } from "@/modules/analytics/types/rh-digest";

function isDigestV1(value: unknown): value is RhDeptKpisDigestV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.activeEmployees === "number" &&
    typeof v.pendingLeaves === "number" &&
    typeof v.rhUnreadAlerts === "number" &&
    typeof v.attendanceToday === "number" &&
    Array.isArray(v.recentHires)
  );
}

/** Hydrate le contrat KPI dept depuis une ligne snapshot matérialisée. */
export function rhDeptKpiPayloadFromSnapshot(payload: unknown, computedAtIso: string): DeptKpiPayload | null {
  if (!isDigestV1(payload)) return null;
  const recentHires = payload.recentHires;
  return {
    stats: [
      {
        id: "activeEmployees",
        label: "dashboard.dept.kpi.activeEmployees",
        value: payload.activeEmployees,
        unit: "count",
      },
      {
        id: "presentToday",
        label: "dashboard.dept.kpi.presentToday",
        value: payload.attendanceToday,
        unit: "count",
      },
      {
        id: "pendingLeaves",
        label: "dashboard.dept.kpi.pendingLeaves",
        value: payload.pendingLeaves,
        unit: "count",
      },
      {
        id: "rhUnreadAlerts",
        label: "dashboard.rh.kpi.unreadAlerts",
        value: payload.rhUnreadAlerts,
        unit: "count",
      },
    ],
    charts: [],
    alerts: [],
    activity: recentHires.map((hire) => ({
      id: hire.id,
      label: [hire.first_name, hire.last_name].filter(Boolean).join(" ").trim() || "dashboard.dept.activity.newHire",
      timestamp: hire.created_at ?? undefined,
    })),
    health: { status: "placeholder", notes: ["dashboard.dept.health.partialAttendance"] },
    metadata: {
      source: "rh-snapshot",
      generatedAt: computedAtIso,
      placeholder: true,
    },
  };
}
