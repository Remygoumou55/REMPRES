import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { EmployeeHierarchyNode } from "@/modules/hr/employees/types";

export async function listEmployeeHierarchy(): Promise<EmployeeHierarchyNode[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_employee_hierarchy")
    .select("employee_id,manager_id,department_key,title,active")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  return (data ?? []).map((row) => ({
    employeeId: row.employee_id,
    managerId: row.manager_id,
    departmentKey: row.department_key,
    title: row.title,
    active: row.active,
  }));
}

