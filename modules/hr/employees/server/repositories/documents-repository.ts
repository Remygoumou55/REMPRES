import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { EmployeeDocument } from "@/modules/hr/employees/types";

export async function listEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_employee_documents")
    .select("id,employee_id,document_type,file_name,storage_path,created_at")
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    documentType: row.document_type,
    fileName: row.file_name,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }));
}

