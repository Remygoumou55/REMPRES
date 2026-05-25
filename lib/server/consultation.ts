import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import type {
  Appointment,
  CreateAppointmentInput,
  CreateDeliverableInput,
  CreateMissionInput,
  CreatePhaseInput,
  Deliverable,
  Mission,
  MissionPhase,
} from "@/lib/types/consultation";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { ChartPoint } from "@/lib/server/dept-dashboard";

type ListParams = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type AppointmentListParams = ListParams & {
  period?: "today" | "week" | "all";
};

function formatGNF(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export async function listMissions(
  params: ListParams = {},
): Promise<{ data: Mission[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("missions" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(`title.ilike.%${s}%,reference.ilike.%${s}%,client_name.ilike.%${s}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Mission[], total: count ?? 0 };
}

export async function getMissionById(id: string): Promise<Mission | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("missions" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Mission | null) ?? null;
}

export async function createMission(
  input: CreateMissionInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("missions" as never)
    .insert({
      title: input.title,
      description: input.description ?? null,
      client_name: input.client_name ?? null,
      client_id: input.client_id ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      budget_gnf: input.budget_gnf ?? 0,
      lead_consultant: input.lead_consultant ?? null,
      status: input.status ?? "draft",
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateMission(
  id: string,
  input: Partial<CreateMissionInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("missions" as never).update(input as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteMission(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("missions" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listAppointments(
  params: AppointmentListParams = {},
): Promise<{ data: Appointment[]; total: number }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("appointments" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  const period = params.period ?? "all";
  if (period === "today") {
    query = query.eq("appointment_date", todayIso());
  } else if (period === "week") {
    query = query.gte("appointment_date", todayIso()).lte("appointment_date", weekEndIso());
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as Appointment[], total: count ?? 0 };
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments" as never)
    .insert({
      title: input.title,
      appointment_date: input.appointment_date,
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
      location: input.location ?? null,
      client_name: input.client_name ?? null,
      mission_id: input.mission_id ?? null,
      description: input.description ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateAppointment(
  id: string,
  input: Partial<CreateAppointmentInput & { status?: string }>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("appointments" as never).update(input as never).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteAppointment(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("appointments" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listDeliverables(missionId: string): Promise<Deliverable[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("deliverables" as never)
    .select("*")
    .eq("mission_id", missionId)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Deliverable[];
}

export async function createDeliverable(
  input: CreateDeliverableInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("deliverables" as never)
    .insert({
      mission_id: input.mission_id,
      phase_id: input.phase_id ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.due_date ?? null,
      status: input.status ?? "pending",
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function listMissionPhases(missionId: string): Promise<MissionPhase[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("mission_phases" as never)
    .select("*")
    .eq("mission_id", missionId)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MissionPhase[];
}

export async function createMissionPhase(
  input: CreatePhaseInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("mission_phases" as never)
    .insert({
      mission_id: input.mission_id,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "pending",
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      order_index: input.order_index ?? 0,
    } as never)
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: String((data as { id: string }).id) };
}

export async function listUniqueConsultationClients(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const rows = await safeRows<{ client_name: string | null }>(
    supabase
      .from("missions" as never)
      .select("client_name")
      .is("deleted_at", null)
      .not("client_name", "is", null),
  );
  const names = new Set<string>();
  rows.forEach((r) => {
    const n = r.client_name?.trim();
    if (n) names.add(n);
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
}

export async function listMissionsForSelect(): Promise<{ id: string; label: string }[]> {
  const { data } = await listMissions({ pageSize: 200 });
  return data.map((m) => ({ id: m.id, label: `${m.reference} — ${m.title}` }));
}

export type ConsultationDashboardKpis = {
  activeMissions: number;
  completedMissions: number;
  pendingDeliverables: number;
  appointmentsThisWeek: number;
  revenueThisMonth: number;
  revenueFormatted: string;
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
};

export async function getConsultationDashboardKpis(): Promise<ConsultationDashboardKpis> {
  const supabase = getSupabaseServerClient();
  const monthStart = monthStartIso();
  const today = todayIso();
  const weekEnd = weekEndIso();

  const [
    activeMissions,
    completedMissions,
    pendingDeliverables,
    appointmentsThisWeek,
    paidMissions,
    chartMissions,
    recentActivity,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("missions" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("missions" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("deliverables" as never)
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"])
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("appointments" as never)
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", today)
        .lte("appointment_date", weekEnd)
        .is("deleted_at", null),
    ),
    safeRows<{ amount_paid_gnf: number }>(
      supabase
        .from("missions" as never)
        .select("amount_paid_gnf")
        .gte("updated_at", monthStart)
        .is("deleted_at", null),
    ),
    safeRows<{ updated_at: string; amount_paid_gnf: number }>(
      supabase
        .from("missions" as never)
        .select("updated_at, amount_paid_gnf")
        .gte("updated_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .is("deleted_at", null),
    ),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("consultation"), limit: 6 }),
  ]);

  const revenueThisMonth = paidMissions.reduce((s, r) => s + Number(r.amount_paid_gnf ?? 0), 0);
  const chartMap = new Map<string, number>();
  chartMissions.forEach((r) => {
    const d = new Date(r.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    chartMap.set(d, (chartMap.get(d) ?? 0) + Number(r.amount_paid_gnf ?? 0));
  });
  const chart7Days = Array.from(chartMap.entries())
    .map(([date, value]) => ({ date, value }))
    .slice(-7);

  return {
    activeMissions,
    completedMissions,
    pendingDeliverables,
    appointmentsThisWeek,
    revenueThisMonth,
    revenueFormatted: formatGNF(revenueThisMonth),
    chart7Days,
    recentActivity,
  };
}
