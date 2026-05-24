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
import { computeRhDeptKpisLive } from "@/modules/analytics/aggregation/rh-dept-kpi-live";
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
      return getConsultationDashboard(supabase);
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
  const [rhPayload, activity] = await Promise.all([
    computeRhDeptKpisLive(supabase),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("rh"), limit: 6 }),
  ]);

  const stat = (id: string) => rhPayload.stats.find((s) => s.id === id)?.value ?? 0;
  const employees = Number(stat("activeEmployees"));
  const leaves = Number(stat("pendingLeaves"));
  const attendance = Number(stat("presentToday"));
  const hasData = employees > 0 || leaves > 0 || attendance > 0;

  return {
    dept: "rh",
    deptLabel: DEPT_META.rh.label,
    deptColor: DEPT_META.rh.color,
    kpis: [
      {
        title: "Employés actifs",
        icon: "Users",
        color: "purple",
        value: employees,
        isEmpty: !hasData,
        subtitle: "Profils actifs",
      },
      {
        title: "Congés en attente",
        icon: "Calendar",
        color: "orange",
        value: leaves,
        isEmpty: !hasData,
        subtitle: "À valider",
      },
      {
        title: "Présences aujourd'hui",
        icon: "Clock",
        color: "green",
        value: attendance,
        isEmpty: attendance === 0,
        subtitle: attendance > 0 ? "Événements du jour" : "Module en cours d'activation",
      },
      {
        title: "Nouveaux ce mois",
        icon: "UserPlus",
        color: "blue",
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

async function getFormationDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const [trainings, trainees, certs, activity] = await Promise.all([
    safeCount(
      supabase.from("trainings" as never).select("*", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    ),
    safeCount(supabase.from("trainees" as never).select("*", { count: "exact", head: true }).is("deleted_at", null)),
    safeCount(supabase.from("certificates" as never).select("*", { count: "exact", head: true })),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("formation"), limit: 6 }),
  ]);

  return {
    dept: "formation",
    deptLabel: DEPT_META.formation.label,
    deptColor: DEPT_META.formation.color,
    kpis: [
      { title: "Formations actives", icon: "GraduationCap", color: "orange", value: trainings },
      { title: "Apprenants inscrits", icon: "Users", color: "blue", value: trainees },
      { title: "Certificats émis", icon: "Award", color: "green", value: certs },
      {
        title: "Revenus formation",
        icon: "TrendingUp",
        color: "teal",
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

async function getConsultationDashboard(supabase: SupabaseClient<Database>): Promise<DeptKpiData> {
  const [active, completed, clients, activity] = await Promise.all([
    safeCount(
      supabase.from("missions" as never).select("*", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    ),
    safeCount(supabase.from("missions" as never).select("*", { count: "exact", head: true }).eq("status", "completed")),
    safeCount(
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("client_type", "company")
        .is("deleted_at", null),
    ),
    getRecentActivity(supabase, { moduleKeys: getDeptActivityModuleKeys("consultation"), limit: 6 }),
  ]);

  return {
    dept: "consultation",
    deptLabel: DEPT_META.consultation.label,
    deptColor: DEPT_META.consultation.color,
    kpis: [
      { title: "Missions actives", icon: "Briefcase", color: "blue", value: active },
      { title: "Missions terminées", icon: "CheckCircle", color: "green", value: completed },
      { title: "Clients entreprises", icon: "Building2", color: "purple", value: clients },
      {
        title: "CA missions",
        icon: "TrendingUp",
        color: "teal",
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
  const productRows = await safeRows<{ stock_quantity: number | null; stock_threshold: number | null }>(
    supabase.from("products").select("stock_quantity, stock_threshold").is("deleted_at", null),
  );

  let items = 0;
  let lowItems = 0;
  for (const p of productRows) {
    items++;
    const qty = p.stock_quantity ?? 0;
    const threshold = p.stock_threshold ?? 5;
    if (qty <= threshold) lowItems++;
  }

  const activity = await getRecentActivity(supabase, {
    moduleKeys: getDeptActivityModuleKeys("logistique"),
    limit: 6,
  });

  return {
    dept: "logistique",
    deptLabel: DEPT_META.logistique.label,
    deptColor: DEPT_META.logistique.color,
    kpis: [
      { title: "Articles en stock", icon: "Package", color: "blue", value: items },
      {
        title: "Articles sous seuil",
        icon: "AlertTriangle",
        color: lowItems > 0 ? "red" : "green",
        value: lowItems,
      },
      {
        title: "Mouvements ce mois",
        icon: "ArrowLeftRight",
        color: "purple",
        value: "—",
        isEmpty: true,
        subtitle: "Module en cours d'activation",
      },
      {
        title: "Valeur stock",
        icon: "BarChart3",
        color: "teal",
        value: "—",
        isEmpty: true,
        subtitle: "Module en cours d'activation",
      },
    ],
    chart7Days: [],
    recentActivity: activity,
    alerts:
      lowItems > 0
        ? [
            {
              id: "low-stock-logistique",
              level: "MEDIUM",
              title: `${lowItems} article(s) sous seuil minimum`,
              description: "Vérifiez le stock et lancez une commande.",
              time: "Maintenant",
            },
          ]
        : [],
  };
}
