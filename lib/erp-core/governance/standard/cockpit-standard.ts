/**
 * B2.4 — COCKPIT STANDARD ERP (contrat normatif, aligné M3 COCKPIT_ZONE_ORDER).
 */

import { COCKPIT_ZONE_ORDER } from "@/lib/navigation/erp-ux-architecture";
import { ERP_GOVERNANCE_STANDARD_VERSION } from "@/lib/erp-core/governance/standard/standard-version";

export const ERP_COCKPIT_STANDARD_VERSION = ERP_GOVERNANCE_STANDARD_VERSION;

/** Zones cockpit officielles M3 — ordre non négociable. */
export const ERP_COCKPIT_ZONE_ORDER = COCKPIT_ZONE_ORDER;

export type ErpCockpitPayloadContract = {
  source: string;
  generatedAt: string;
  userDisplayName: string;
  /** Chaque slice KPI référence sa source domaine (pas de double vérité). */
  domainSources: Record<string, string>;
};

export const ERP_COCKPIT_SURFACES = {
  manager: "app/(app)/dept/{dept} → DeptHomePage + getDeptDashboardData",
  supervision: "app/(app)/dept/{dept} + /api/dept/{dept}/kpis",
  super_admin: "/dashboard + SuperAdminCockpitClient (gelé)",
} as const;

export const ERP_COCKPIT_FORBIDDEN_PATTERNS = [
  "crm_nav_grid_as_homepage",
  "raw_url_quick_actions",
  "getDashboardKpis_as_manager_dept_cockpit",
  "help_center_layout",
  "dept_supervision_cards_on_manager_cockpit",
] as const;

export const ERP_COCKPIT_ALERT_RULES = {
  max_visible: 8,
  must_have_resolution_href: true,
  severity_levels: ["critical", "warning", "info"] as const,
};

export const ERP_COCKPIT_QUICK_ACTION_RULES = {
  max_count: 6,
  must_have_label_not_url: true,
  permission_filtered: true,
};

/** Référence Vente live — runtime dept unifié (Bloc 2). */
export const VENTE_REFERENCE_COCKPIT = {
  payload: "lib/server/dept-dashboard.ts",
  ui: "components/dashboard/dept-home-page.tsx",
  route: "/dept/vente",
  legacy_redirect: "/vente/dashboard",
  payload_contract: "lib/vente/runtime/vente-cockpit-payload.ts",
  source: "vente-cockpit-runtime-v1",
} as const;
