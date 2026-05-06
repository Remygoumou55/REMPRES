import { cache } from "react";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

/** Département Administration : supervision / pilotage uniquement (pas d’opérations vente–clients–produits). */
export function isAdministrationSupervisionDepartmentKey(
  departmentKey: string | null | undefined,
): boolean {
  return normalizeDepartmentKey(departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

export const getProfileDepartmentKey = cache(async (userId: string): Promise<string | null> => {
  if (!userId?.trim()) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("department_key")
    .eq("id", userId.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data.department_key ?? null;
});

/** Bloque les mutations opérationnelles pour les profils département administration. */
export async function assertNotAdministrationSupervisionOnly(userId: string): Promise<void> {
  const dk = await getProfileDepartmentKey(userId);
  if (isAdministrationSupervisionDepartmentKey(dk)) {
    throw new Error(
      "Les comptes du département administration ont un accès supervision (rapports et historique) sans opérations commerciales directes.",
    );
  }
}
