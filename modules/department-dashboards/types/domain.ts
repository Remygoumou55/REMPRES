import type { DepartmentKey } from "@/lib/constants/departments";

export type DepartmentDashboardVerticalId =
  | "hr"
  | "finance"
  | "crm"
  | "logistics"
  | "ai"
  | "observability"
  | "tenants"
  | "cloud"
  | "governance";

/** Lien opérationnel — cible une route existante (aucune route parallèle). */
export type DepartmentOperationalLink = {
  id: string;
  vertical: DepartmentDashboardVerticalId;
  href: string;
  labelKey: string;
  /** Si défini, le lien est pertinent surtout pour ce département métier. */
  primaryDeptKey?: DepartmentKey;
};
