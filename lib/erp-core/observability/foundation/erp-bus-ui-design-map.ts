/**
 * P8 — ERP_BUS_UI_DESIGN (read-only minimal).
 */

export const ERP_BUS_UI_DESIGN_VERSION = "erp-bus-ui-design-p8-v1" as const;

export type ErpBusUiSection = {
  id: string;
  title: string;
  routeAnchor: string;
  dataSource: string;
  readOnly: true;
  controlsForbidden: readonly string[];
};

export const ERP_BUS_UI_DESIGN: readonly ErpBusUiSection[] = [
  {
    id: "summary",
    title: "Synthèse bus",
    routeAnchor: "#summary",
    dataSource: "snapshot.summary",
    readOnly: true,
    controlsForbidden: ["replay", "kill", "publish"],
  },
  {
    id: "recent_events",
    title: "Événements récents",
    routeAnchor: "#events",
    dataSource: "snapshot.recentEvents",
    readOnly: true,
    controlsForbidden: ["replay", "republish"],
  },
  {
    id: "handlers",
    title: "Handlers actifs",
    routeAnchor: "#handlers",
    dataSource: "snapshot.handlers.registrations",
    readOnly: true,
    controlsForbidden: ["register", "unregister"],
  },
  {
    id: "notifications",
    title: "Notifications (bridge)",
    routeAnchor: "#notifications",
    dataSource: "snapshot.recentNotifications",
    readOnly: true,
    controlsForbidden: ["direct tryCreateAlert"],
  },
  {
    id: "automation",
    title: "Automation traces",
    routeAnchor: "#automation",
    dataSource: "snapshot.recentAutomation",
    readOnly: true,
    controlsForbidden: ["auto_write", "rule_edit"],
  },
  {
    id: "failures",
    title: "Échecs handlers",
    routeAnchor: "#failures",
    dataSource: "snapshot.failures",
    readOnly: true,
    controlsForbidden: ["retry", "skip"],
  },
] as const;

export const ERP_BUS_UI_ROUTE = {
  path: "/erp/observability",
  file: "app/(app)/erp/observability/page.tsx",
  layout: "app/(app)/layout.tsx",
  pattern: "read_only_tables",
  marketingDashboardForbidden: true,
} as const;
