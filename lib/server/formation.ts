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

export async function getEnrollmentById(id: string): Promise<EnrollmentRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("enrollments" as never)
    .select(
      "*, trainee:trainees(first_name,last_name), training:trainings(title)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as EnrollmentRow;
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
): Promise<{ success: boolean; id?: string; certNumber?: string; error?: string }> {
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
    .select("id, certificate_number")
    .single();
  if (error) return { success: false, error: error.message };
  const row = data as { id: string; certificate_number: string };
  return {
    success: true,
    id: String(row.id),
    certNumber: String(row.certificate_number),
  };
}

export type CertificatePdfPayload = {
  certificate: {
    id: string;
    certificate_number: string;
    issued_at: string;
    valid_until: string | null;
    score: number | null;
    grade: string | null;
    notes: string | null;
  };
  trainee: {
    first_name: string;
    last_name: string;
    email: string | null;
    company: string | null;
  };
  training: {
    title: string;
    duration_hours: number | null;
    category: string | null;
  };
};

export async function getCertificateDataById(
  id: string,
): Promise<CertificatePdfPayload | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("certificates" as never)
    .select(
      `id, certificate_number, issued_at, valid_until, score, grade, notes,
       trainee:trainees(first_name, last_name, email, company),
       training:trainings(title, duration_hours, category)`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const trainee = row.trainee as Record<string, unknown> | null;
  const training = row.training as Record<string, unknown> | null;
  if (!trainee || !training) return null;

  return {
    certificate: {
      id: String(row.id),
      certificate_number: String(row.certificate_number),
      issued_at: String(row.issued_at),
      valid_until: row.valid_until != null ? String(row.valid_until) : null,
      score: row.score != null ? Number(row.score) : null,
      grade: row.grade != null ? String(row.grade) : null,
      notes: row.notes != null ? String(row.notes) : null,
    },
    trainee: {
      first_name: String(trainee.first_name),
      last_name: String(trainee.last_name),
      email: trainee.email != null ? String(trainee.email) : null,
      company: trainee.company != null ? String(trainee.company) : null,
    },
    training: {
      title: String(training.title),
      duration_hours: training.duration_hours != null ? Number(training.duration_hours) : null,
      category: training.category != null ? String(training.category) : null,
    },
  };
}

/** Map enrollment_id (or trainee:training key) → certificate summary for list UIs. */
export async function getEnrollmentCertificateMap(): Promise<
  Record<string, { id: string; certificate_number: string }>
> {
  const supabase = getSupabaseServerClient();
  const rows = await safeRows<{
    id: string;
    certificate_number: string;
    enrollment_id: string | null;
    trainee_id: string;
    training_id: string;
  }>(
    supabase
      .from("certificates" as never)
      .select("id, certificate_number, enrollment_id, trainee_id, training_id")
      .is("deleted_at", null),
  );

  const map: Record<string, { id: string; certificate_number: string }> = {};
  for (const c of rows) {
    const entry = { id: c.id, certificate_number: c.certificate_number };
    if (c.enrollment_id) map[c.enrollment_id] = entry;
    map[`${c.trainee_id}:${c.training_id}`] = entry;
  }
  return map;
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

export type ApprenantDetail = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
  total_formations: number;
  completed_formations: number;
  certified_formations: number;
  in_progress_formations: number;
  enrollments: {
    id: string;
    training_name: string;
    enrolled_at: string;
    completed_at: string | null;
    status: string;
    progress_pct: number;
  }[];
  certificates: {
    id: string;
    certificate_number: string;
    training_name: string;
    issued_at: string;
  }[];
};

export async function getApprenantById(id: string): Promise<ApprenantDetail | null> {
  const supabase = getSupabaseServerClient();

  const { data: learner, error } = await supabase
    .from("trainees" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !learner) return null;
  const learnerCreatedAt = (learner as { created_at?: string | null }).created_at ?? new Date().toISOString();

  const [enrollmentsResult, certificatesResult] = await Promise.all([
    supabase
      .from("enrollments" as never)
      .select("id, status, progress_pct, enrolled_at, completed_at, created_at, training:trainings(title)")
      .eq("trainee_id", id)
      .is("deleted_at", null)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("certificates" as never)
      .select("id, certificate_number, issued_at, created_at, training:trainings(title)")
      .eq("trainee_id", id)
      .is("deleted_at", null)
      .order("issued_at", { ascending: false }),
  ]);

  const enrollments = (enrollmentsResult.data ?? []).map((e) => {
    const row = e as {
      id: string;
      status?: string | null;
      progress_pct?: number | null;
      enrolled_at?: string | null;
      completed_at?: string | null;
      created_at?: string | null;
      training?: { title?: string | null } | null;
    };
    return {
      id: row.id,
      training_name: row.training?.title ?? "Formation inconnue",
      enrolled_at: row.enrolled_at ?? row.created_at ?? learnerCreatedAt,
      completed_at: row.completed_at ?? null,
      status: row.status ?? "in_progress",
      progress_pct: Number(row.progress_pct ?? 0),
    };
  });

  const certificates = (certificatesResult.data ?? []).map((c) => {
    const row = c as {
      id: string;
      certificate_number?: string | null;
      issued_at?: string | null;
      created_at?: string | null;
      training?: { title?: string | null } | null;
    };
    return {
      id: row.id,
      certificate_number: row.certificate_number ?? "CERT-???",
      training_name: row.training?.title ?? "Formation inconnue",
      issued_at: row.issued_at ?? row.created_at ?? learnerCreatedAt,
    };
  });

  const total = enrollments.length;
  const completed = enrollments.filter(
    (e) => e.status === "completed" || e.status === "certified" || e.progress_pct >= 100,
  ).length;
  const certified = certificates.length;
  const inProgress = enrollments.filter((e) => e.status === "in_progress" && e.progress_pct < 100).length;

  const fullName = `${(learner as { first_name?: string | null }).first_name ?? ""} ${(learner as { last_name?: string | null }).last_name ?? ""}`.trim();

  return {
    id: String((learner as { id: string }).id),
    full_name: fullName || "Apprenant",
    email: ((learner as { email?: string | null }).email ?? null) as string | null,
    phone: ((learner as { phone?: string | null }).phone ?? null) as string | null,
    status: ((learner as { status?: string | null }).status ?? "active") as string | null,
    created_at: learnerCreatedAt,
    total_formations: total,
    completed_formations: completed,
    certified_formations: certified,
    in_progress_formations: inProgress,
    enrollments,
    certificates,
  };
}
