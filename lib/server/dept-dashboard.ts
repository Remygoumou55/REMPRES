/**
 * KPIs cockpit département — source serveur pour DeptHomePage (hors Super Admin).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { DepartmentKey } from "@/lib/constants/departments";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { getFinanceTreasuryKpis } from "@/lib/finance/runtime/finance-treasury-kpis";
import { getVenteCommerceKpis } from "@/lib/vente/runtime/vente-commerce-kpis";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { safeCount, safeRows } from "@/lib/utils/safe-query";

export type DeptKey = DepartmentKey;

export type DeptKpiColor = "blue" | "green" | "orange" | "purple" | "pink" | "red" | "teal";

export interface DeptKpi {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: DeptKpiColor;
  trend?: { label: string; direction: "up" | "down" | "neutral" };
  isEmpty?: boolean;
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface AlertItem {
  id: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  time: string;
}

export interface DeptKpiData {
  dept: DeptKey;
  deptLabel: string;
  deptColor: string;
  kpis: DeptKpi[];
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
}

const DEPT_META: Record<DeptKey, { label: string; color: string }> = {
  vente: { label: "Vente", color: "#2D7CC4" },
  finance: { label: "Finance", color: "#10B981" },
  rh: { label: "Ressources Humaines", color: "#8B5CF6" },
  formation: { label: "Formation", color: "#F59E0B" },
  consultation: { label: "Consultation", color: "#0E4A8A" },
  marketing: { label: "Marketing", color: "#EC4899" },
  logistique: { label: "Logistique", color: "#6B7280" },
};

export async function getDeptDashboardData(
  supabase: SupabaseClient<Database>,
  dept: DeptKey,
  userId: string,
): Promise<DeptKpiData> {
  void userId;
  switch (dept) {
    case "vente":
      return getVenteDashboard(supabase);
    case "finance":
      return getFinanceDashboard(supabase);
    case "rh":
      return getRhDashboard(supabase);
    case "formation":
      return getFormationDashboard(supabase);
    case "consultation":
      return getFormationDashboard(supabase);
    case "marketing":
      return getMarketingDashboard(supabase);
    case "logistique":
      return getLogistiqueDashboard(supabase);
    default:
      return emptyDeptPayload(dept);
  }
}

function emptyDeptPayload(dept: DeptKey): DeptKpiData {
  const meta = DEPT_META[dept] ?? { label: dept, color: "#2D7CC4" };
  return {
    dept,
    deptLabel: meta.label,
    deptColor: meta.color,
    kpis: [],
    chart7Days: [],
    recentActivity: [],
    alerts: [],
  };
}

function formatGNF(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} GNF`;
}

function buildChart7DaysFromExpenses(rows: { created_at: string; amount_gnf: number }[]): ChartPoint[] {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const d = new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    map.set(d, (map.get(d) ?? 0) + Number(r.amount_gnf ?? 0));
  });
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .slice(-7);
}

function chartFromDayStats(days: { label: string; amount: number }[]): ChartPoint[] {
  return days.map((d) => ({ date: d.label, value: d.amount }));
}

async function getVenteDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const [commerce, activity] = await Promise.all([
    getVenteCommerceKpis(supabase),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("vente"), limit: 6 }),
  ]);

  const lowStock = commerce.productsLowStock + commerce.productsOutOfStock;

  return {
    dept: "vente",
    deptLabel: DEPT_META.vente.label,
    deptColor: DEPT_META.vente.color,
    kpis: [
      {
        title: "CA du mois",
        icon: "TrendingUp",
        color: "green",
        value: formatGNF(commerce.netSaleAmountMonth),
        subtitle: "Chiffre d'affaires net",
      },
      {
        title: "Clients actifs",
        icon: "Users",
        color: "blue",
        value: commerce.clientsTotal,
        subtitle: "Base clients totale",
      },
      {
        title: "Produits en stock",
        icon: "Package",
        color: "purple",
        value: commerce.productsTotal,
        subtitle: "Produits actifs",
      },
      {
        title: "Stock à surveiller",
        icon: "AlertTriangle",
        color: lowStock > 0 ? "red" : "green",
        value: lowStock,
        subtitle: "Produits sous seuil ou rupture",
      },
    ],
    chart7Days: chartFromDayStats(commerce.salesLast7Days),
    recentActivity: activity,
    alerts:
      lowStock > 0
        ? [
            {
              id: "low-stock",
              level: "MEDIUM",
              title: `${lowStock} produit(s) à stock faible`,
              description: "Vérifiez les seuils de réapprovisionnement.",
              time: "Maintenant",
            },
          ]
        : [],
  };
}

async function getFinanceDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [treasury, transactions, expenseRows, activity] = await Promise.all([
    getFinanceTreasuryKpis(supabase, now),
    safeCount(
      supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart)
        .is("deleted_at", null),
    ),
    safeRows<{ created_at: string; amount_gnf: number }>(
      supabase
        .from("expenses")
        .select("created_at, amount_gnf")
        .gte("created_at", sevenDaysAgo)
        .is("deleted_at", null),
    ),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("finance"), limit: 6 }),
  ]);

  const revenue = treasury.netRevenueMonth;
  const expenses = treasury.expensesMonth;
  const benefice = treasury.profitMonth;

  const chart7Days =
    treasury.treasuryLast7Days.length > 0
      ? chartFromDayStats(treasury.treasuryLast7Days)
      : buildChart7DaysFromExpenses(expenseRows);

  const alerts: AlertItem[] =
    benefice < 0
      ? [
          {
            id: "negative-margin",
            level: "HIGH",
            title: "Marge nette négative",
            description: "Les dépenses dépassent les revenus sur la période.",
            time: "Ce mois",
          },
        ]
      : [];

  return {
    dept: "finance",
    deptLabel: DEPT_META.finance.label,
    deptColor: DEPT_META.finance.color,
    kpis: [
      { title: "Revenus du mois", icon: "TrendingUp", color: "green", value: formatGNF(revenue) },
      { title: "Dépenses du mois", icon: "Receipt", color: "orange", value: formatGNF(expenses) },
      {
        title: "Bénéfice net",
        icon: "Activity",
        color: benefice >= 0 ? "teal" : "red",
        value: formatGNF(benefice),
      },
      { title: "Transactions", icon: "CreditCard", color: "blue", value: transactions, subtitle: "Ce mois" },
    ],
    chart7Days,
    recentActivity: activity,
    alerts,
  };
}

async function getRhDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  void supabase;
  const { getRhDashboardKpis } = await import("@/lib/server/rh");
  const kpis = await getRhDashboardKpis();

  return {
    dept: "rh",
    deptLabel: DEPT_META.rh.label,
    deptColor: DEPT_META.rh.color,
    kpis: [
      {
        title: "Collaborateurs actifs",
        icon: "Users",
        color: "purple",
        value: kpis.activeEmployees,
        subtitle: `${kpis.totalEmployees} au total`,
      },
      {
        title: "Congés en attente",
        icon: "Calendar",
        color: "orange",
        value: kpis.pendingLeaveRequests,
        subtitle: "À valider par RH",
      },
      {
        title: "Présents aujourd'hui",
        icon: "Clock",
        color: "green",
        value: kpis.presentToday,
        subtitle: `${kpis.absentToday} absents · ${kpis.lateToday} en retard`,
      },
      {
        title: "Nouveaux ce mois",
        icon: "UserPlus",
        color: "blue",
        value: kpis.newHiresThisMonth,
        subtitle: "Recrutements du mois en cours",
      },
    ],
    chart7Days: kpis.chart7Days,
    recentActivity: kpis.recentActivity,
    alerts: [],
  };
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function todayDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekEndDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function mergeRevenueChart7Days(
  enrollmentRows: { enrolled_at: string; amount_paid_gnf: number }[],
  missionRows: { updated_at: string; amount_paid_gnf: number }[],
): ChartPoint[] {
  const map = new Map<string, number>();
  enrollmentRows.forEach((r) => {
    const d = new Date(r.enrolled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    map.set(d, (map.get(d) ?? 0) + Number(r.amount_paid_gnf ?? 0));
  });
  missionRows.forEach((r) => {
    const d = new Date(r.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    map.set(d, (map.get(d) ?? 0) + Number(r.amount_paid_gnf ?? 0));
  });
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .slice(-7);
}

async function getFormationDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const monthStart = monthStartIso();
  const sevenDaysAgo = sevenDaysAgoIso();
  const today = todayDateIso();
  const weekEnd = weekEndDateIso();

  const [
    activeTrainings,
    totalTrainees,
    certificatesIssued,
    enrollmentsThisMonth,
    revenueFormationThisMonth,
    formationChart7Rows,
    activeMissions,
    pendingDeliverables,
    appointmentsThisWeek,
    revenueConsultationThisMonth,
    consultationChart7Rows,
    activityFormation,
    activityConsultation,
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
    safeCount(
      supabase.from("certificates" as never).select("*", { count: "exact", head: true }).is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("enrollments" as never)
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart)
        .is("deleted_at", null),
    ),
    safeRows<{ amount_paid_gnf: number }>(
      supabase
        .from("enrollments" as never)
        .select("amount_paid_gnf")
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
    safeCount(
      supabase
        .from("missions" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("deliverables" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
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
        .gte("updated_at", sevenDaysAgo)
        .is("deleted_at", null),
    ),
    getRecentActivity(supabase, { moduleKeys: ["formation"], limit: 6 }),
    getRecentActivity(supabase, { moduleKeys: ["consultation"], limit: 6 }),
  ]);

  const revenueFormationThisMonthTotal = revenueFormationThisMonth.reduce(
    (s, r) => s + Number(r.amount_paid_gnf ?? 0),
    0,
  );
  const revenueConsultationThisMonthTotal = revenueConsultationThisMonth.reduce(
    (s, r) => s + Number(r.amount_paid_gnf ?? 0),
    0,
  );

  const chart7Days = mergeRevenueChart7Days(formationChart7Rows, consultationChart7Rows);

  const recentActivity = [...activityFormation, ...activityConsultation].slice(0, 6);

  const alerts: AlertItem[] =
    pendingDeliverables > 0
      ? [
          {
            id: "pending-deliverables",
            level: "MEDIUM",
            title: `${pendingDeliverables} livrable(s) en attente`,
            description: "Consultation — suivi des livrables requis.",
            time: "Maintenant",
          },
        ]
      : [];

  return {
    dept: "formation",
    deptLabel: DEPT_META.formation.label,
    deptColor: DEPT_META.formation.color,
    kpis: [
      { title: "Formations actives", icon: "GraduationCap", color: "orange", value: activeTrainings },
      { title: "Apprenants inscrits", icon: "Users", color: "blue", value: totalTrainees },
      { title: "Certificats émis", icon: "Award", color: "green", value: certificatesIssued },
      {
        title: "Inscriptions ce mois",
        icon: "ClipboardList",
        color: "purple",
        value: enrollmentsThisMonth,
        subtitle: formatGNF(revenueFormationThisMonthTotal),
      },
      { title: "Missions actives", icon: "Briefcase", color: "blue", value: activeMissions },
      {
        title: "Livrables en attente",
        icon: "FileText",
        color: pendingDeliverables > 0 ? "orange" : "green",
        value: pendingDeliverables,
      },
      {
        title: "RDV cette semaine",
        icon: "Calendar",
        color: "teal",
        value: appointmentsThisWeek,
        subtitle: "Consultation",
      },
      {
        title: "CA consultation",
        icon: "TrendingUp",
        color: "teal",
        value: formatGNF(revenueConsultationThisMonthTotal),
        subtitle: "Missions — mois en cours",
      },
    ],
    chart7Days,
    recentActivity,
    alerts,
  };
}

async function getMarketingDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const [campaigns, leads, activity] = await Promise.all([
    safeCount(
      supabase.from("campaigns" as never).select("*", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    ),
    safeCount(supabase.from("leads" as never).select("*", { count: "exact", head: true })),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("marketing"), limit: 6 }),
  ]);

  return {
    dept: "marketing",
    deptLabel: DEPT_META.marketing.label,
    deptColor: DEPT_META.marketing.color,
    kpis: [
      { title: "Campagnes actives", icon: "Megaphone", color: "pink", value: campaigns },
      { title: "Leads totaux", icon: "Target", color: "blue", value: leads },
      {
        title: "Conversions",
        icon: "TrendingUp",
        color: "green",
        value: "—",
        isEmpty: true,
        subtitle: "Module en cours d'activation",
      },
      {
        title: "ROI moyen",
        icon: "BarChart3",
        color: "orange",
        value: "—",
        isEmpty: true,
        subtitle: "Module en cours d'activation",
      },
    ],
    chart7Days: [],
    recentActivity: activity,
    alerts: [],
  };
}

async function getLogistiqueDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  void supabase;
  const { getLogistiqueDashboardKpis } = await import("@/lib/server/logistique");
  const kpis = await getLogistiqueDashboardKpis();

  return {
    dept: "logistique",
    deptLabel: DEPT_META.logistique.label,
    deptColor: DEPT_META.logistique.color,
    kpis: [
      {
        title: "Articles en stock",
        icon: "Package",
        color: "blue",
        value: kpis.totalItems,
        subtitle: `${kpis.activeSuppliers} fournisseur${kpis.activeSuppliers > 1 ? "s" : ""} actif${kpis.activeSuppliers > 1 ? "s" : ""}`,
      },
      {
        title: "Stock bas / rupture",
        icon: "AlertTriangle",
        color: kpis.outOfStockItems > 0 ? "red" : kpis.lowStockItems > 0 ? "orange" : "green",
        value: kpis.lowStockItems + kpis.outOfStockItems,
        subtitle: `${kpis.lowStockItems} bas · ${kpis.outOfStockItems} en rupture`,
      },
      {
        title: "Mouvements (7j)",
        icon: "ArrowLeftRight",
        color: "purple",
        value: kpis.movementsThisWeek,
        subtitle: "Entrées, sorties, transferts",
      },
      {
        title: "Valeur stock (GNF)",
        icon: "BarChart3",
        color: "teal",
        value: Math.round(kpis.totalInventoryValueGnf).toLocaleString("fr-FR"),
        subtitle: "Inventaire valorisé",
      },
      {
        title: "Commandes ouvertes",
        icon: "ShoppingCart",
        color: kpis.pendingOrders > 0 ? "orange" : "green",
        value: kpis.pendingOrders,
        subtitle: "Soumises ou approuvées",
      },
    ],
    chart7Days: kpis.chart7Days,
    recentActivity: kpis.recentActivity,
    alerts: kpis.alerts,
  };
}
