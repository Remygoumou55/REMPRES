import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import {
  CONTRACT_TYPE_LABELS,
  type AttendanceRow,
  type ContractType,
  type CreateEmployeeInput,
  type CreateLeaveRequestInput,
  type Employee,
  type LeaveRequest,
  type RecordAttendanceInput,
  type UpdateEmployeeInput,
} from "@/lib/types/rh";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { ChartPoint } from "@/lib/server/dept-dashboard";

/**
 * RH — source de vérité collaborateurs : table `employees`.
 * Timeline : `rh_employee_history` (journal, pas doublon). Audit : docs/DUPLICATE_TABLES_AUDIT.md § Paire 1.
 */

type ListEmployeesParams = {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
};

type ListLeaveParams = {
  employeeId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type ListAttendanceParams = {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function todayDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════════════════════════════════════

export async function listEmployees(
  params: ListEmployeesParams = {},
): Promise<{ data: Employee[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const limit = params.limit ?? 25;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("employees" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.department && params.department !== "all") {
    query = query.eq("department", params.department);
  }
  if (params.status && params.status !== "all") {
    if (params.status === "active") query = query.eq("is_active", true);
    else if (params.status === "inactive") query = query.eq("is_active", false);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,position.ilike.%${s}%`,
    );
  }

  const result = await query.range(from, to);
  if (result.error) {
    return { data: [], total: 0 };
  }
  return {
    data: (result.data ?? []) as Employee[],
    total: result.count ?? 0,
  };
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("employees" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return null;
  return (data as Employee | null) ?? null;
}

export async function listEmployeesForSelect(): Promise<
  { id: string; label: string; department: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("employees" as never)
    .select("id,first_name,last_name,department")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .limit(500);
  return ((data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    department: string;
  }>).map((row) => ({
    id: row.id,
    label: `${row.first_name} ${row.last_name}`.trim(),
    department: row.department,
  }));
}

export async function listEmployeeDepartments(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("employees" as never)
    .select("department")
    .is("deleted_at", null);
  const set = new Set<string>();
  ((data ?? []) as Array<{ department: string | null }>).forEach((row) => {
    const d = (row.department ?? "").trim();
    if (d) set.add(d);
  });
  return Array.from(set).sort();
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();

  const first = String(input.first_name ?? "").trim();
  const last = String(input.last_name ?? "").trim();
  const position = String(input.position ?? "").trim();
  const department = String(input.department ?? "").trim();
  const hireDate = String(input.hire_date ?? "").trim();

  if (!first || !last || !position || !department || !hireDate) {
    return { success: false, error: "Champs obligatoires manquants." };
  }

  const { data, error } = await supabase
    .from("employees" as never)
    .insert({
      first_name: first,
      last_name: last,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      position,
      department,
      hire_date: hireDate,
      salary_gnf: Number(input.salary_gnf ?? 0) || 0,
      contract_type: input.contract_type,
      is_active: input.is_active ?? true,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.first_name !== undefined) patch.first_name = input.first_name;
  if (input.last_name !== undefined) patch.last_name = input.last_name;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.position !== undefined) patch.position = input.position;
  if (input.department !== undefined) patch.department = input.department;
  if (input.hire_date !== undefined) patch.hire_date = input.hire_date;
  if (input.salary_gnf !== undefined) patch.salary_gnf = Number(input.salary_gnf) || 0;
  if (input.contract_type !== undefined) patch.contract_type = input.contract_type;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const { error } = await supabase
    .from("employees" as never)
    .update(patch as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteEmployee(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("employees" as never)
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function setEmployeeActive(
  id: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("employees" as never)
    .update({ is_active: active } as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAVE REQUESTS
// ═══════════════════════════════════════════════════════════════════════════

export async function listLeaveRequests(
  params: ListLeaveParams = {},
): Promise<{ data: LeaveRequest[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leave_requests" as never)
    .select(
      "*,employee:employees(first_name,last_name,position,department)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.employeeId) query = query.eq("employee_id", params.employeeId);
  if (params.status && params.status !== "all") query = query.eq("status", params.status);

  const result = await query.range(from, to);
  if (result.error) return { data: [], total: 0 };
  return {
    data: (result.data ?? []) as LeaveRequest[],
    total: result.count ?? 0,
  };
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("leave_requests" as never)
    .select("*,employee:employees(first_name,last_name,position,department)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return null;
  return (data as LeaveRequest | null) ?? null;
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const employeeId = String(input.employee_id ?? "").trim();
  const start = String(input.start_date ?? "").trim();
  const end = String(input.end_date ?? "").trim();
  if (!employeeId || !start || !end) {
    return { success: false, error: "Champs obligatoires manquants." };
  }
  if (start > end) {
    return { success: false, error: "Dates invalides : la fin précède le début." };
  }
  const { data, error } = await supabase
    .from("leave_requests" as never)
    .insert({
      employee_id: employeeId,
      leave_type: input.leave_type,
      start_date: start,
      end_date: end,
      reason: input.reason ?? null,
      status: "pending",
      requested_by: input.requested_by ?? null,
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateLeaveStatus(
  id: string,
  status: "approved" | "rejected",
  comment?: string,
  reviewedBy?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("leave_requests" as never)
    .update({
      status,
      review_comment: comment ?? null,
      reviewed_by: reviewedBy ?? null,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function countPendingLeaveRequests(): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("leave_requests" as never)
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════

export async function listAttendance(
  params: ListAttendanceParams = {},
): Promise<{ data: AttendanceRow[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 100;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("attendance" as never)
    .select(
      "*,employee:employees(first_name,last_name,position,department)",
      { count: "exact" },
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.employeeId) query = query.eq("employee_id", params.employeeId);
  if (params.dateFrom) query = query.gte("date", params.dateFrom);
  if (params.dateTo) query = query.lte("date", params.dateTo);

  const result = await query.range(from, to);
  if (result.error) return { data: [], total: 0 };
  return {
    data: (result.data ?? []) as AttendanceRow[],
    total: result.count ?? 0,
  };
}

export async function recordAttendance(
  input: RecordAttendanceInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const employeeId = String(input.employee_id ?? "").trim();
  const date = String(input.date ?? todayDateIso()).trim();
  if (!employeeId || !date) {
    return { success: false, error: "Champs obligatoires manquants." };
  }
  const { error } = await supabase
    .from("attendance" as never)
    .upsert(
      {
        employee_id: employeeId,
        date,
        status: input.status,
        arrival_time: input.arrival_time ?? null,
        departure_time: input.departure_time ?? null,
        notes: input.notes ?? null,
        recorded_by: input.recorded_by ?? null,
      } as never,
      { onConflict: "employee_id,date" } as never,
    );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAttendanceMonthlyStats(
  employeeId: string,
): Promise<{ present: number; absent: number; late: number; halfDay: number }> {
  const supabase = getSupabaseServerClient();
  const monthStart = startOfMonthIso().slice(0, 10);
  const { data } = await supabase
    .from("attendance" as never)
    .select("status")
    .eq("employee_id", employeeId)
    .gte("date", monthStart);
  const rows = (data ?? []) as Array<{ status: string }>;
  return {
    present: rows.filter((r) => r.status === "present").length,
    absent: rows.filter((r) => r.status === "absent").length,
    late: rows.filter((r) => r.status === "late").length,
    halfDay: rows.filter((r) => r.status === "half_day").length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD KPIs
// ═══════════════════════════════════════════════════════════════════════════

export type RhDashboardKpis = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingLeaveRequests: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  newHiresThisMonth: number;
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
};

export async function getRhDashboardKpis(): Promise<RhDashboardKpis> {
  const supabase = getSupabaseServerClient();
  const today = todayDateIso();
  const monthStart = startOfMonthIso().slice(0, 10);
  const sevenDaysAgo = plusDaysIso(-7);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    pendingLeaveRequests,
    presentToday,
    absentToday,
    lateToday,
    newHiresThisMonth,
    last7Attendance,
    activity,
  ] = await Promise.all([
    safeCount(
      supabase.from("employees" as never).select("*", { count: "exact", head: true }).is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("employees" as never)
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_active", true),
    ),
    safeCount(
      supabase
        .from("employees" as never)
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_active", false),
    ),
    safeCount(
      supabase
        .from("leave_requests" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("attendance" as never)
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .eq("status", "present"),
    ),
    safeCount(
      supabase
        .from("attendance" as never)
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .eq("status", "absent"),
    ),
    safeCount(
      supabase
        .from("attendance" as never)
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .eq("status", "late"),
    ),
    safeCount(
      supabase
        .from("employees" as never)
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("hire_date", monthStart),
    ),
    safeRows<{ date: string; status: string }>(
      supabase
        .from("attendance" as never)
        .select("date,status")
        .gte("date", sevenDaysAgo)
        .order("date", { ascending: true }),
    ),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("rh"), limit: 8 }),
  ]);

  const chartMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    chartMap.set(d, 0);
  }
  for (const row of last7Attendance) {
    if (row.status === "present" && chartMap.has(row.date)) {
      chartMap.set(row.date, (chartMap.get(row.date) ?? 0) + 1);
    }
  }
  const chart7Days: ChartPoint[] = Array.from(chartMap.entries()).map(([date, value]) => ({
    date,
    value,
  }));

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    pendingLeaveRequests,
    presentToday,
    absentToday,
    lateToday,
    newHiresThisMonth,
    chart7Days,
    recentActivity: activity,
  };
}

export type EmployeeContractData = {
  id: string;
  full_name: string;
  position: string;
  department: string | null;
  email: string | null;
  contract_type: string;
  hire_date: string;
  trial_period_months: number;
  work_hours_per_week: number;
  work_location: string;
  salary_gnf: number;
  contract_number: string;
  generated_at: string;
};

export function buildEmployeeContractData(employee: Employee): EmployeeContractData {
  const full_name = `${employee.first_name} ${employee.last_name}`.trim() || "Collaborateur";
  const hire_date = employee.hire_date ?? employee.created_at ?? new Date().toISOString();
  const contract_number = `CTR-${employee.id.slice(-4).toUpperCase()}`;
  const rawContract = String(employee.contract_type ?? "cdi").toLowerCase() as ContractType;
  const contract_type =
    CONTRACT_TYPE_LABELS[rawContract] ?? rawContract.toUpperCase();

  return {
    id: employee.id,
    full_name,
    position: employee.position ?? "Collaborateur",
    department: employee.department ?? null,
    email: employee.email ?? null,
    contract_type,
    hire_date,
    trial_period_months: Number(employee.trial_period_months ?? 3),
    work_hours_per_week: Number(employee.work_hours_per_week ?? 40),
    work_location: employee.work_location ?? "Conakry",
    salary_gnf: Number(employee.salary_gnf ?? 0),
    contract_number,
    generated_at: new Date().toISOString(),
  };
}

export async function getContractData(
  employeeId: string,
): Promise<EmployeeContractData | null> {
  const employee = await getEmployeeById(employeeId);
  if (!employee) return null;
  return buildEmployeeContractData(employee);
}

// ─── Performance reviews ───────────────────────────────────────

export type {
  PerformanceReview,
  PerformanceReviewStatus,
  CriteriaKey,
} from "@/lib/rh/performance-reviews-shared";
export {
  SCORE_LABELS,
  CRITERIA_LABELS,
  getOverallLabel,
} from "@/lib/rh/performance-reviews-shared";

import type {
  PerformanceReview,
  PerformanceReviewStatus,
} from "@/lib/rh/performance-reviews-shared";

export type CreateReviewInput = {
  employee_id: string;
  reviewer_id: string;
  period_label: string;
  score_quality: number;
  score_punctuality: number;
  score_teamwork: number;
  score_initiative: number;
  score_objectives: number;
  comments?: string;
  objectives_next_period?: string;
  status: PerformanceReviewStatus;
};

type PerformanceReviewRow = {
  id: string;
  employee_id: string;
  reviewer_id: string | null;
  period_label: string;
  score_quality: number;
  score_punctuality: number;
  score_teamwork: number;
  score_initiative: number;
  score_objectives: number;
  overall_score: number;
  comments: string | null;
  objectives_next_period: string | null;
  status: PerformanceReviewStatus;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    position: string;
    department: string;
  } | null;
};

function mapPerformanceReview(row: PerformanceReviewRow): PerformanceReview {
  const emp = row.employee;
  const employee_name = emp
    ? `${emp.first_name} ${emp.last_name}`.trim()
    : "Collaborateur";
  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name,
    employee_position: emp?.position ?? "—",
    employee_department: emp?.department ?? "—",
    reviewer_id: row.reviewer_id,
    period_label: row.period_label,
    score_quality: Number(row.score_quality),
    score_punctuality: Number(row.score_punctuality),
    score_teamwork: Number(row.score_teamwork),
    score_initiative: Number(row.score_initiative),
    score_objectives: Number(row.score_objectives),
    overall_score: Number(row.overall_score),
    comments: row.comments,
    objectives_next_period: row.objectives_next_period,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function listEmployeeReviews(employeeId: string): Promise<PerformanceReview[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("performance_reviews" as never)
    .select(
      "*,employee:employees(first_name,last_name,position,department)",
    )
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return ((data ?? []) as PerformanceReviewRow[]).map(mapPerformanceReview);
}

export async function listAllReviews(params?: {
  status?: PerformanceReviewStatus;
  period?: string;
}): Promise<PerformanceReview[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("performance_reviews" as never)
    .select(
      "*,employee:employees(first_name,last_name,position,department)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.period?.trim()) {
    query = query.ilike("period_label", `%${params.period.trim()}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as PerformanceReviewRow[]).map(mapPerformanceReview);
}

export async function createReview(
  input: CreateReviewInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("performance_reviews" as never)
    .insert({
      employee_id: input.employee_id,
      reviewer_id: input.reviewer_id,
      period_label: input.period_label.trim(),
      score_quality: input.score_quality,
      score_punctuality: input.score_punctuality,
      score_teamwork: input.score_teamwork,
      score_initiative: input.score_initiative,
      score_objectives: input.score_objectives,
      comments: input.comments?.trim() || null,
      objectives_next_period: input.objectives_next_period?.trim() || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de l'enregistrement." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}
