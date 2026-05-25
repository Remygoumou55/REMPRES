import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import type {
  CertificateRow,
  CreateEnrollmentInput,
  CreateTraineeInput,
  CreateTrainingInput,
  EnrollmentRow,
  IssueCertificateInput,
  Trainee,
  Training,
  TrainingSession,
} from "@/lib/types/formation";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { ChartPoint } from "@/lib/server/dept-dashboard";

type ListParams = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function formatGNF(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export async function listTrainings(
  params: ListParams = {},
): Promise<{ data: Training[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("trainings" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(`title.ilike.%${s}%,category.ilike.%${s}%,instructor_name.ilike.%${s}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Training[], total: count ?? 0 };
}

export async function getTrainingById(id: string): Promise<Training | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainings" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Training | null) ?? null;
}

export async function listTrainingSessions(trainingId: string): Promise<TrainingSession[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_sessions" as never)
    .select("*")
    .eq("training_id", trainingId)
    .is("deleted_at", null)
    .order("session_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrainingSession[];
}

export async function countTrainingEnrollments(trainingId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("enrollments" as never)
      .select("*", { count: "exact", head: true })
      .eq("training_id", trainingId)
      .is("deleted_at", null),
  );
}

export async function countTrainingCertificates(trainingId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("certificates" as never)
      .select("*", { count: "exact", head: true })
      .eq("training_id", trainingId)
      .is("deleted_at", null),
  );
}

export async function createTraining(
  input: CreateTrainingInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainings" as never)
    .insert({
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      duration_hours: input.duration_hours ?? 0,
      price_gnf: input.price_gnf ?? 0,
      max_participants: input.max_participants ?? 20,
      instructor_name: input.instructor_name ?? null,
      location: input.location ?? null,
      status: input.status ?? "draft",
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateTraining(
  id: string,
  input: Partial<CreateTrainingInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trainings" as never).update(input as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteTraining(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("trainings" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listTrainees(
  params: ListParams = {},
): Promise<{ data: Trainee[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("trainees" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`,
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Trainee[], total: count ?? 0 };
}

export async function getTraineeById(id: string): Promise<Trainee | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainees" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Trainee | null) ?? null;
}

export async function createTrainee(
  input: CreateTraineeInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainees" as never)
    .insert({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      function: input.function ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateTrainee(
  id: string,
  input: Partial<CreateTraineeInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trainees" as never).update(input as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteTrainee(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("trainees" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listEnrollments(
  trainingId?: string,
  status?: string,
): Promise<{ data: EnrollmentRow[]; total: number }> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("enrollments" as never)
    .select(
      "*, trainee:trainees(first_name,last_name), training:trainings(title)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("enrolled_at", { ascending: false });

  if (trainingId) query = query.eq("training_id", trainingId);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as EnrollmentRow[], total: count ?? 0 };
}

export async function createEnrollment(
  input: CreateEnrollmentInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("enrollments" as never)
    .insert({
      training_id: input.training_id,
      trainee_id: input.trainee_id,
      session_id: input.session_id ?? null,
      status: input.status ?? "pending",
      amount_paid_gnf: input.amount_paid_gnf ?? 0,
      payment_method: input.payment_method ?? null,
      paid_at: input.amount_paid_gnf ? new Date().toISOString() : null,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateEnrollmentStatus(
  id: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("enrollments" as never).update({ status } as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listCertificates(
  params: { page?: number; pageSize?: number } = {},
): Promise<{ data: CertificateRow[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("certificates" as never)
    .select(
      "*, trainee:trainees(first_name,last_name), training:trainings(title)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as CertificateRow[], total: count ?? 0 };
}

export async function issueCertificate(
  input: IssueCertificateInput,
): Promise<{ success: boolean; certNumber?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("certificates" as never)
    .insert({
      training_id: input.training_id,
      trainee_id: input.trainee_id,
      enrollment_id: input.enrollment_id ?? null,
      score: input.score ?? null,
      grade: input.grade ?? null,
      valid_until: input.valid_until ?? null,
      notes: input.notes ?? null,
    } as never)
    .select("certificate_number")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, certNumber: String((data as { certificate_number: string }).certificate_number) };
}

export async function listTrainingsForSelect(): Promise<{ id: string; title: string }[]> {
  const supabase = getSupabaseServerClient();
  const rows = await safeRows<{ id: string; title: string }>(
    supabase
      .from("trainings" as never)
      .select("id, title")
      .is("deleted_at", null)
      .order("title"),
  );
  return rows;
}

export async function listTraineesForSelect(): Promise<{ id: string; label: string }[]> {
  const { data } = await listTrainees({ pageSize: 500 });
  return data.map((t) => ({
    id: t.id,
    label: `${t.first_name} ${t.last_name}`.trim(),
  }));
}

export type FormationDashboardKpis = {
  activeTrainings: number;
  totalTrainees: number;
  certificatesIssued: number;
  enrollmentsThisMonth: number;
  revenueThisMonth: number;
  revenueFormatted: string;
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
};

export async function getFormationDashboardKpis(): Promise<FormationDashboardKpis> {
  const supabase = getSupabaseServerClient();
  const monthStart = monthStartIso();
  const sevenDaysAgo = sevenDaysAgoIso();

  const [
    activeTrainings,
    totalTrainees,
    certificatesIssued,
    enrollmentsThisMonth,
    enrollmentRevenueRows,
    chartRows,
    recentActivity,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("trainings" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase.from("trainees" as never).select("*", { count: "exact", head: true }).is("deleted_at", null),
    ),
    safeCount(supabase.from("certificates" as never).select("*", { count: "exact", head: true })),
    safeCount(
      supabase
        .from("enrollments" as never)
        .select("*", { count: "exact", head: true })
        .gte("enrolled_at", monthStart)
        .is("deleted_at", null),
    ),
    safeRows<{ enrolled_at: string; amount_paid_gnf: number }>(
      supabase
        .from("enrollments" as never)
        .select("enrolled_at, amount_paid_gnf")
        .gte("enrolled_at", sevenDaysAgo)
        .is("deleted_at", null),
    ),
    safeRows<{ enrolled_at: string; amount_paid_gnf: number }>(
      supabase
        .from("enrollments" as never)
        .select("enrolled_at, amount_paid_gnf")
        .gte("enrolled_at", monthStart)
        .is("deleted_at", null),
    ),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("formation"), limit: 6 }),
  ]);

  const revenueThisMonth = chartRows.reduce((s, r) => s + Number(r.amount_paid_gnf ?? 0), 0);
  const chartMap = new Map<string, number>();
  enrollmentRevenueRows.forEach((r) => {
    const d = new Date(r.enrolled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    chartMap.set(d, (chartMap.get(d) ?? 0) + Number(r.amount_paid_gnf ?? 0));
  });
  const chart7Days = Array.from(chartMap.entries())
    .map(([date, value]) => ({ date, value }))
    .slice(-7);

  return {
    activeTrainings,
    totalTrainees,
    certificatesIssued,
    enrollmentsThisMonth,
    revenueThisMonth,
    revenueFormatted: formatGNF(revenueThisMonth),
    chart7Days,
    recentActivity,
  };
}
