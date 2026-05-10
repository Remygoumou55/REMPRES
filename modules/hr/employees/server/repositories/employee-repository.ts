import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { EmployeeProfile } from "@/modules/hr/employees/types";
import { employeeFullName } from "@/modules/hr/employees/utils";

export async function listEmployeeProfiles(limit = 200): Promise<EmployeeProfile[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,role_key,department_key,is_active,created_at")
    .is("deleted_at", null)
    .neq("role_key", "super_admin")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: employeeFullName(row.first_name, row.last_name, row.email, row.id),
    email: row.email,
    roleKey: row.role_key,
    departmentKey: row.department_key,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

