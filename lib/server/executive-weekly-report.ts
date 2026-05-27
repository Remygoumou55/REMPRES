/**
 * Rapport hebdomadaire direction — agrégation multi-départements.
 */
import type { WeeklyReportData } from "@/lib/executive/weekly-report-types";
import { getWeekBounds } from "@/lib/executive/week-utils";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type { WeeklyReportData, WeeklyReportSection } from "@/lib/executive/weekly-report-types";
export {
  getISOWeek,
  getISOWeekYear,
  getWeekBounds,
  listRecentIsoWeeks,
} from "@/lib/executive/week-utils";

const FR_MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${FR_MONTHS_SHORT[d.getMonth()]}`;
}

function formatGnf(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} GNF`;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type SaleRow = {
  total_amount_gnf: number | null;
  lifecycle_status: string | null;
  payment_status: string | null;
};

async function queryTrainingSessionsWeek(
  startISO: string,
  endISO: string,
): Promise<{ id: string }[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("training_sessions" as never)
      .select("id")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null);
    if (error) return [];
    return (data ?? []) as { id: string }[];
  } catch {
    return [];
  }
}

export async function getWeeklyReportData(
  weekNumber: number,
  year: number,
  generatedBy: string,
): Promise<WeeklyReportData> {
  const supabase = getSupabaseServerClient();
  const { start, end } = getWeekBounds(weekNumber, year);
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const startDate = toDateStr(start);
  const endDate = toDateStr(end);

  const trainingSessionsPromise = queryTrainingSessionsWeek(startISO, endISO);

  const [
    salesRes,
    expensesRes,
    employeesRes,
    leaveRes,
    stockRes,
    tasksRes,
    projectsRes,
    campaignsRes,
    leadsRes,
    trainings,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount_gnf, lifecycle_status, payment_status")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("amount_gnf")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .is("deleted_at", null),
    supabase.from("employees" as never).select("id, is_active").is("deleted_at", null),
    supabase
      .from("leave_requests" as never)
      .select("id, status")
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("stock_items" as never)
      .select("id, quantity, min_quantity")
      .is("deleted_at", null),
    supabase
      .from("erp_ops_tasks" as never)
      .select("id, status, due_at")
      .is("deleted_at", null),
    supabase
      .from("erp_ops_projects" as never)
      .select("id, status")
      .is("deleted_at", null),
    supabase
      .from("campaigns" as never)
      .select("id, status")
      .is("deleted_at", null),
    supabase
      .from("leads" as never)
      .select("id")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null),
    trainingSessionsPromise,
  ]);

  const sales = (salesRes.data ?? []) as SaleRow[];
  const validatedSales = sales.filter(
    (s) =>
      s.lifecycle_status === "validated" ||
      s.payment_status === "paid" ||
      s.payment_status === "partial",
  );
  const weekRevenue = validatedSales.reduce(
    (sum, s) => sum + Number(s.total_amount_gnf ?? 0),
    0,
  );

  const expenses = expensesRes.data ?? [];
  const weekExpenses = expenses.reduce(
    (sum, e) => sum + Number((e as { amount_gnf?: number }).amount_gnf ?? 0),
    0,
  );

  const employees = (employeesRes.data ?? []) as { is_active?: boolean | null }[];
  const activeEmployees = employees.filter((e) => e.is_active !== false).length;
  const pendingLeaves = (leaveRes.data ?? []).length;

  const stockItems = (stockRes.data ?? []) as {
    quantity?: number | null;
    min_quantity?: number | null;
  }[];
  const lowStockCount = stockItems.filter((s) => {
    const minQty = Number(s.min_quantity ?? 0);
    return Number(s.quantity ?? 0) < minQty;
  }).length;

  const tasks = (tasksRes.data ?? []) as {
    status?: string;
    due_at?: string | null;
  }[];
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const today = new Date().toISOString();
  const overdueTasks = tasks.filter((t) => {
    const due = t.due_at;
    return (
      due &&
      due < today &&
      t.status !== "done" &&
      t.status !== "cancelled"
    );
  }).length;
  const activeProjects = (projectsRes.data ?? []).filter(
    (p) => (p as { status?: string }).status === "active",
  ).length;

  const activeCampaigns = (campaignsRes.data ?? []).filter(
    (c) => (c as { status?: string }).status === "active",
  ).length;
  const newLeads = (leadsRes.data ?? []).length;
  const weekTrainings = trainings.length;

  const sections: WeeklyReportData["sections"] = {
    vente: {
      label: "Vente",
      kpis: [
        { label: "CA de la semaine", value: formatGnf(weekRevenue) },
        { label: "Ventes validées", value: String(validatedSales.length) },
      ],
      alerts: weekRevenue === 0 ? ["Aucune vente cette semaine"] : [],
    },
    finance: {
      label: "Finance",
      kpis: [
        { label: "Dépenses de la semaine", value: formatGnf(weekExpenses) },
        { label: "Résultat semaine", value: formatGnf(weekRevenue - weekExpenses) },
      ],
      alerts:
        weekExpenses > weekRevenue && weekRevenue > 0
          ? ["Dépenses supérieures aux revenus"]
          : weekExpenses > 0 && weekRevenue === 0
            ? ["Dépenses sans revenus associés"]
            : [],
    },
    rh: {
      label: "Ressources Humaines",
      kpis: [
        { label: "Collaborateurs actifs", value: String(activeEmployees) },
        { label: "Congés en attente", value: String(pendingLeaves) },
      ],
      alerts:
        pendingLeaves > 3
          ? [`${pendingLeaves} demandes de congé en attente`]
          : [],
    },
    logistique: {
      label: "Logistique",
      kpis: [
        { label: "Articles sous seuil", value: String(lowStockCount) },
        { label: "Total articles", value: String(stockItems.length) },
      ],
      alerts:
        lowStockCount > 0
          ? [`${lowStockCount} article(s) à réapprovisionner`]
          : [],
    },
    operations: {
      label: "Opérations",
      kpis: [
        { label: "Tâches en cours", value: String(inProgressTasks) },
        { label: "Tâches en retard", value: String(overdueTasks) },
        { label: "Projets actifs", value: String(activeProjects) },
      ],
      alerts: overdueTasks > 0 ? [`${overdueTasks} tâche(s) en retard`] : [],
    },
    marketing: {
      label: "Marketing",
      kpis: [
        { label: "Campagnes actives", value: String(activeCampaigns) },
        { label: "Nouveaux leads", value: String(newLeads) },
      ],
      alerts: [],
    },
    formation: {
      label: "Formation & Consultation",
      kpis: [
        { label: "Sessions cette semaine", value: String(weekTrainings) },
      ],
      alerts: [],
    },
  };

  const allAlerts = Object.values(sections).flatMap((s) => s.alerts ?? []);
  const highlights = allAlerts.slice(0, 5);

  const weekLabel = `Semaine ${weekNumber} · ${formatShortDate(start)}–${formatShortDate(end)} ${year}`;

  return {
    week: {
      number: weekNumber,
      start: startDate,
      end: endDate,
      label: weekLabel,
      year,
    },
    sections,
    highlights,
    generated_at: new Date().toISOString(),
    generated_by: generatedBy,
  };
}
