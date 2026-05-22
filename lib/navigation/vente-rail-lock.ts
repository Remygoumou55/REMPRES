/**
 * Contrat verrouillage rail Vente (M1.5 + M3) — validation uniquement, pas de rebuild.
 */
import { DEPARTMENT_KEYS, DEPARTMENT_NAVIGATION } from "@/lib/departments/department-config";
import {
  OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE,
} from "@/lib/navigation/erp-ux-architecture";
import type { DepartmentSidebarGroup } from "@/lib/navigation/department-sidebar-nav";

/** Préfixe route unique du domaine Vente. */
export const VENTE_ROUTE_PREFIX = "/vente" as const;

/** Libellé domaine (≠ sous-groupe Commerce). */
export const VENTE_DOMAIN_LABEL = DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.VENTE].label;

/**
 * Identifiants de groupes repliables sous Vente (M3).
 * Ce ne sont PAS des modules top-level du shell legacy.
 */
export const VENTE_NAV_SUBGROUP_IDS = ["commerce", "crm"] as const;

/** Modules legacy interdits comme rails top-level parallèles (M1.5). */
export const FORBIDDEN_VENTE_TOP_LEVEL_MODULE_IDS = ["commerce", "crm"] as const;

export type VenteRailOwnershipReport = {
  valid: boolean;
  issues: string[];
  domainLabel: string;
  subgroupIds: string[];
  allHrefsUnderVente: boolean;
};

/** Valide que la navigation Vente reste un domaine unique (M1.5). */
export function validateVenteRailOwnership(
  groups: DepartmentSidebarGroup[],
): VenteRailOwnershipReport {
  const issues: string[] = [];
  const venteArch = OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[DEPARTMENT_KEYS.VENTE];

  if (!venteArch) {
    issues.push("Architecture sidebar VENTE absente du contrat M3.");
  }

  const subgroupIds = groups.map((g) => g.id);
  const allLinks = groups.flatMap((g) => g.links);

  for (const href of allLinks.map((l) => l.href)) {
    if (!href.startsWith(VENTE_ROUTE_PREFIX)) {
      issues.push(`Lien hors domaine Vente: ${href}`);
    }
  }

  if (groups.length === 0) {
    issues.push("Aucun groupe sidebar pour VENTE.");
  }

  const allHrefsUnderVente = issues.filter((i) => i.startsWith("Lien hors")).length === 0;

  return {
    valid: issues.length === 0,
    issues,
    domainLabel: VENTE_DOMAIN_LABEL,
    subgroupIds,
    allHrefsUnderVente,
  };
}
