import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { EmployeeContract } from "@/modules/hr/contracts/types";

export async function listContracts(limit = 300): Promise<EmployeeContract[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_employee_contracts")
    .select(
      "id,employee_id,contract_type,status,start_date,end_date,salary_gnf,title,renewal_window_days,approval_request_id,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    contractType: row.contract_type,
    status: row.status as EmployeeContract["status"],
    startDate: row.start_date,
    endDate: row.end_date,
    salaryGnf: row.salary_gnf,
    title: row.title,
    renewalWindowDays: row.renewal_window_days,
    approvalRequestId: row.approval_request_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getContractById(contractId: string): Promise<EmployeeContract | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_employee_contracts")
    .select(
      "id,employee_id,contract_type,status,start_date,end_date,salary_gnf,title,renewal_window_days,approval_request_id,created_at,updated_at",
    )
    .eq("id", contractId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    employeeId: data.employee_id,
    contractType: data.contract_type,
    status: data.status as EmployeeContract["status"],
    startDate: data.start_date,
    endDate: data.end_date,
    salaryGnf: data.salary_gnf,
    title: data.title,
    renewalWindowDays: data.renewal_window_days,
    approvalRequestId: data.approval_request_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

