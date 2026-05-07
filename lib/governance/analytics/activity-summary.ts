import type { DepartmentKey } from "@/lib/departments/department-config";

type ActivityRow = {
  module_key: string;
  created_at: string;
};

const MODULE_TO_DEPARTMENT: Record<string, DepartmentKey> = {
  clients: "VENTE",
  produits: "VENTE",
  vente: "VENTE",
  sales: "VENTE",
  finance: "FINANCE",
  depenses: "FINANCE",
  expenses: "FINANCE",
  rh: "RH",
  formation: "FORMATION",
  consultation: "CONSULTATION",
  marketing: "MARKETING",
  logistique: "LOGISTIQUE",
};

export function summarizeDepartmentActivity(
  rows: ActivityRow[],
  departments: DepartmentKey[],
): Record<DepartmentKey, number> {
  const counts = Object.fromEntries(departments.map((k) => [k, 0])) as Record<DepartmentKey, number>;
  for (const row of rows) {
    const moduleKey = String(row.module_key ?? "").trim().toLowerCase();
    const dept = MODULE_TO_DEPARTMENT[moduleKey];
    if (dept && dept in counts) {
      counts[dept] += 1;
    }
  }
  return counts;
}
