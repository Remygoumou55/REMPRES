import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { PayslipData, EmployeePayslipData } from "@/components/rh/PayslipPDF";

export type { PayslipData, EmployeePayslipData };

export type Payslip = PayslipData & {
  employee_id: string;
  employee?: {
    first_name: string;
    last_name: string;
    position: string;
    department: string;
  } | null;
};

export type CreatePayslipInput = {
  employee_id: string;
  month: number;
  year: number;
  salary_gnf: number;
  bonus_gnf?: number;
  deductions_gnf?: number;
  days_worked?: number;
  days_absent?: number;
  leave_days?: number;
  notes?: string;
  generated_by: string;
};

export async function createPayslip(
  input: CreatePayslipInput,
): Promise<{ success: boolean; id?: string; payslipData?: PayslipData; error?: string }> {
  const supabase = getSupabaseServerClient();

  const row = {
    employee_id: input.employee_id,
    month: input.month,
    year: input.year,
    salary_gnf: input.salary_gnf,
    bonus_gnf: input.bonus_gnf ?? 0,
    deductions_gnf: input.deductions_gnf ?? 0,
    days_worked: input.days_worked ?? 0,
    days_absent: input.days_absent ?? 0,
    leave_days: input.leave_days ?? 0,
    notes: input.notes ?? null,
    generated_by: input.generated_by,
    generated_at: new Date().toISOString(),
  };

  const sb = supabase as unknown as {
    from: (t: string) => {
      upsert: (v: unknown, opts?: unknown) => { select: () => { single: <T>() => Promise<{ data: T | null; error: { message: string } | null }> } };
    };
  };
  const { data, error } = await sb
    .from("payslips")
    .upsert(row, { onConflict: "employee_id,month,year", ignoreDuplicates: false })
    .select()
    .single<Record<string, unknown>>();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Aucune donnée retournée." };
  }

  const d = data as Record<string, unknown>;
  const payslipData: PayslipData = {
    id: String(d.id ?? ""),
    month: Number(d.month),
    year: Number(d.year),
    salary_gnf: Number(d.salary_gnf ?? 0),
    bonus_gnf: Number(d.bonus_gnf ?? 0),
    deductions_gnf: Number(d.deductions_gnf ?? 0),
    net_salary_gnf: Number(d.net_salary_gnf ?? 0),
    days_worked: Number(d.days_worked ?? 0),
    days_absent: Number(d.days_absent ?? 0),
    leave_days: Number(d.leave_days ?? 0),
    notes: typeof d.notes === "string" ? d.notes : null,
    generated_at: typeof d.generated_at === "string" ? d.generated_at : null,
  };

  return { success: true, id: payslipData.id, payslipData };
}

export async function listPayslips(params: {
  employeeId?: string;
  year?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Payslip[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = (supabase as ReturnType<typeof getSupabaseServerClient>)
    .from("payslips" as never)
    .select(
      `id, employee_id, month, year, salary_gnf, bonus_gnf,
       deductions_gnf, net_salary_gnf, days_worked, days_absent,
       leave_days, notes, generated_by, generated_at, created_at,
       employees:employee_id(first_name, last_name, position, department)`,
      { count: "exact" },
    )
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .range(from, to);

  if (params.employeeId) {
    query = query.eq("employee_id" as never, params.employeeId);
  }
  if (params.year) {
    query = query.eq("year" as never, params.year);
  }

  const { data, count, error } = await query;

  if (error || !data) return { data: [], total: 0 };

  const rows = (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id ?? ""),
    employee_id: String(r.employee_id ?? ""),
    month: Number(r.month),
    year: Number(r.year),
    salary_gnf: Number(r.salary_gnf ?? 0),
    bonus_gnf: Number(r.bonus_gnf ?? 0),
    deductions_gnf: Number(r.deductions_gnf ?? 0),
    net_salary_gnf: Number(r.net_salary_gnf ?? 0),
    days_worked: Number(r.days_worked ?? 0),
    days_absent: Number(r.days_absent ?? 0),
    leave_days: Number(r.leave_days ?? 0),
    notes: typeof r.notes === "string" ? r.notes : null,
    generated_at: typeof r.generated_at === "string" ? r.generated_at : null,
    employee: r.employees as Payslip["employee"] ?? null,
  }));

  return { data: rows, total: count ?? rows.length };
}

export async function getPayslipById(id: string): Promise<Payslip | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await (supabase as ReturnType<typeof getSupabaseServerClient>)
    .from("payslips" as never)
    .select(
      `id, employee_id, month, year, salary_gnf, bonus_gnf,
       deductions_gnf, net_salary_gnf, days_worked, days_absent,
       leave_days, notes, generated_by, generated_at, created_at,
       employees:employee_id(first_name, last_name, position, department)`,
    )
    .eq("id" as never, id)
    .maybeSingle<Record<string, unknown>>();

  if (error || !data) return null;

  return {
    id: String(data.id ?? ""),
    employee_id: String(data.employee_id ?? ""),
    month: Number(data.month),
    year: Number(data.year),
    salary_gnf: Number(data.salary_gnf ?? 0),
    bonus_gnf: Number(data.bonus_gnf ?? 0),
    deductions_gnf: Number(data.deductions_gnf ?? 0),
    net_salary_gnf: Number(data.net_salary_gnf ?? 0),
    days_worked: Number(data.days_worked ?? 0),
    days_absent: Number(data.days_absent ?? 0),
    leave_days: Number(data.leave_days ?? 0),
    notes: typeof data.notes === "string" ? data.notes : null,
    generated_at: typeof data.generated_at === "string" ? data.generated_at : null,
    employee: data.employees as Payslip["employee"] ?? null,
  };
}

export async function deletePayslip(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await (supabase as ReturnType<typeof getSupabaseServerClient>)
    .from("payslips" as never)
    .delete()
    .eq("id" as never, id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
