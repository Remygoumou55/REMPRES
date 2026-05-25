import type { DepartmentKey } from "@/lib/constants/departments";

const DEPT_MODULE_KEYS: Record<DepartmentKey, string[]> = {
  vente: ["clients", "produits", "vente"],
  finance: ["finance", "depenses"],
  rh: ["rh"],
  formation: ["formation"],
  consultation: ["consultation", "operations"],
  marketing: ["marketing"],
  logistique: ["logistique"],
};

export function getDeptActivityModuleKeys(deptKey: DepartmentKey): string[] {
  return DEPT_MODULE_KEYS[deptKey] ?? [deptKey];
}
