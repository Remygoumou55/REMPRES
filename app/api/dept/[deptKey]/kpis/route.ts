import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";

type RouteContext = { params: { deptKey: string } };

const VALID_KEYS = new Set(DEPARTMENTS.map((d) => d.key));

async function safeCount(promise: PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const result = await promise;
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

async function safeData<T>(promise: PromiseLike<{ data: T | null }>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deptKey = String(params.deptKey ?? "").trim().toLowerCase();
  if (!VALID_KEYS.has(deptKey as DepartmentKey)) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const [superAdmin, adminRole, profileBrief, deptPermission] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
    getProfileAuthBrief(user.id),
    getModulePermissions(user.id, [deptKey]),
  ]);

  const legacyDG = String(profileBrief.roleKey ?? "").trim().toLowerCase() === "directeur_general";
  if (!superAdmin && !adminRole && !legacyDG && !deptPermission.canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  let data: DeptKpiPayload = {
    stats: [],
    charts: [],
    alerts: [],
    activity: [],
    health: { status: "ok" },
    metadata: { source: "dept-kpi-api", generatedAt: now.toISOString() },
  };

  switch (deptKey) {
    case "vente": {
      const [clientsCount, productsCount, salesTodayRows, salesMonthRows, lowStockRows, salesLast7DaysRows, topProductsRows, recentActivityRows] =
        await Promise.all([
          safeCount(supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null)),
          safeCount(supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null)),
          safeData(supabase.from("sales").select("id,created_at").gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()), [] as { id: string; created_at: string }[]),
          safeData(supabase.from("sales").select("total_amount_gnf,created_at").gte("created_at", monthStart), [] as { total_amount_gnf: number | null; created_at: string }[]),
          safeData(supabase.from("products").select("id,stock_quantity,stock_threshold").is("deleted_at", null), [] as { id: string; stock_quantity: number; stock_threshold: number }[]),
          safeData(supabase.from("sales").select("total_amount_gnf,created_at").gte("created_at", sevenDaysAgo).order("created_at", { ascending: true }), [] as { total_amount_gnf: number | null; created_at: string }[]),
          safeData(supabase.from("products").select("id,name").limit(5), [] as { id: string; name: string }[]),
          safeData(
            supabase
              .from("activity_logs")
              .select("id,module_key,action_key,created_at")
              .in("module_key", ["clients", "produits", "vente", "sales", "products"])
              .order("created_at", { ascending: false })
              .limit(5),
            [] as { id: string; module_key: string; action_key: string; created_at: string }[],
          ),
        ]);

      const salesThisMonth = salesMonthRows.reduce((sum, row) => sum + Number(row.total_amount_gnf ?? 0), 0);
      const lowStockCount = lowStockRows.filter((p) => Number(p.stock_quantity ?? 0) <= Number(p.stock_threshold ?? 0)).length;
      const salesByDay = new Map<string, number>();
      for (const row of salesLast7DaysRows) {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        salesByDay.set(key, (salesByDay.get(key) ?? 0) + Number(row.total_amount_gnf ?? 0));
      }

      const salesLast7Days = Array.from(salesByDay.entries()).map(([date, total]) => ({ date, total }));

      data = {
        stats: [
          { id: "clients", label: "dashboard.dept.kpi.clients", value: clientsCount, unit: "count" },
          { id: "products", label: "dashboard.dept.kpi.products", value: productsCount, unit: "count" },
          { id: "salesToday", label: "dashboard.dept.kpi.salesToday", value: salesTodayRows.length, unit: "count" },
          { id: "salesThisMonth", label: "dashboard.dept.kpi.salesThisMonth", value: salesThisMonth, unit: "currency" },
        ],
        charts: [
          {
            id: "salesLast7Days",
            title: "dashboard.dept.chart.salesLast7Days",
            kind: "line",
            xKey: "x",
            series: [{ key: "total", label: "dashboard.dept.chart.totalSales" }],
            points: salesLast7Days.map((item) => ({ x: item.date, total: item.total })),
          },
        ],
        alerts: lowStockCount
          ? [{ id: "lowStock", level: "warning", message: "dashboard.dept.alert.lowStock" }]
          : [],
        activity: recentActivityRows.map((entry) => ({
          id: entry.id,
          label: entry.action_key,
          timestamp: entry.created_at,
        })),
        health: {
          status: "ok",
          notes: topProductsRows.length ? [] : ["dashboard.dept.health.partialTopProducts"],
        },
        metadata: { source: "sales", generatedAt: new Date().toISOString(), placeholder: false },
      };
      break;
    }

    case "finance": {
      const [salesRows, expensesRows, transactionsRows] = await Promise.all([
        safeData(supabase.from("sales").select("total_amount_gnf,created_at").gte("created_at", monthStart), [] as { total_amount_gnf: number | null; created_at: string }[]),
        safeData(supabase.from("expenses").select("amount_gnf,created_at").gte("created_at", monthStart), [] as { amount_gnf: number; created_at: string }[]),
        safeCount(supabase.from("expenses").select("id", { count: "exact", head: true }).gte("created_at", monthStart)),
      ]);
      const totalRevenueMonth = salesRows.reduce((sum, row) => sum + Number(row.total_amount_gnf ?? 0), 0);
      const totalExpensesMonth = expensesRows.reduce((sum, row) => sum + Number(row.amount_gnf ?? 0), 0);
      const byDay = new Map<string, { revenue: number; expenses: number }>();
      for (const row of salesRows) {
        const day = new Date(row.created_at).toISOString().slice(0, 10);
        const current = byDay.get(day) ?? { revenue: 0, expenses: 0 };
        current.revenue += Number(row.total_amount_gnf ?? 0);
        byDay.set(day, current);
      }
      for (const row of expensesRows) {
        const day = new Date(row.created_at).toISOString().slice(0, 10);
        const current = byDay.get(day) ?? { revenue: 0, expenses: 0 };
        current.expenses += Number(row.amount_gnf ?? 0);
        byDay.set(day, current);
      }
      const points = Array.from(byDay.entries()).map(([date, value]) => ({
        x: date,
        revenue: value.revenue,
        expenses: value.expenses,
      }));
      data = {
        stats: [
          { id: "revenue", label: "dashboard.dept.kpi.totalRevenueMonth", value: totalRevenueMonth, unit: "currency" },
          { id: "expenses", label: "dashboard.dept.kpi.totalExpensesMonth", value: totalExpensesMonth, unit: "currency" },
          { id: "margin", label: "dashboard.dept.kpi.netMargin", value: totalRevenueMonth - totalExpensesMonth, unit: "currency" },
          { id: "transactions", label: "dashboard.dept.kpi.transactions", value: transactionsRows, unit: "count" },
        ],
        charts: [
          {
            id: "financeLast7Days",
            title: "dashboard.dept.chart.financeLast7Days",
            kind: "area",
            xKey: "x",
            series: [
              { key: "revenue", label: "dashboard.dept.chart.revenue" },
              { key: "expenses", label: "dashboard.dept.chart.expenses" },
            ],
            points,
          },
        ],
        alerts: [],
        activity: expensesRows.slice(-5).map((expense, index) => ({
          id: `expense-${index}`,
          label: "dashboard.dept.activity.expenseCreated",
          timestamp: expense.created_at,
        })),
        health: { status: "ok" },
        metadata: { source: "finance", generatedAt: new Date().toISOString(), placeholder: false },
      };
      break;
    }

    case "rh": {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const [activeEmployees, pendingLeaves, unreadAlerts, attendanceToday, recentHires] = await Promise.all([
        safeCount(
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .neq("role_key", "super_admin")
            .neq("role_key", "directeur_general"),
        ),
        safeCount(
          supabase
            .from("rh_leave_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
        ),
        safeCount(
          supabase
            .from("governance_alerts")
            .select("id", { count: "exact", head: true })
            .eq("department_key", "rh")
            .eq("status", "unread"),
        ),
        safeCount(
          supabase
            .from("rh_attendance_events")
            .select("id", { count: "exact", head: true })
            .gte("event_at", startOfDay.toISOString()),
        ),
        safeData(
          supabase
            .from("profiles")
            .select("id,first_name,last_name,created_at")
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(3),
          [] as { id: string; first_name: string | null; last_name: string | null; created_at: string | null }[],
        ),
      ]);
      data = {
        stats: [
          { id: "activeEmployees", label: "dashboard.dept.kpi.activeEmployees", value: activeEmployees, unit: "count" },
          { id: "presentToday", label: "dashboard.dept.kpi.presentToday", value: attendanceToday, unit: "count" },
          { id: "pendingLeaves", label: "dashboard.dept.kpi.pendingLeaves", value: pendingLeaves, unit: "count" },
          { id: "rhUnreadAlerts", label: "dashboard.rh.kpi.unreadAlerts", value: unreadAlerts, unit: "count" },
        ],
        charts: [],
        alerts: [],
        activity: recentHires.map((hire) => ({
          id: hire.id,
          label: [hire.first_name, hire.last_name].filter(Boolean).join(" ").trim() || "dashboard.dept.activity.newHire",
          timestamp: hire.created_at ?? undefined,
        })),
        health: { status: "placeholder", notes: ["dashboard.dept.health.partialAttendance"] },
        metadata: { source: "rh", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "formation": {
      data = {
        stats: [
          { id: "activeTrainings", label: "dashboard.dept.kpi.activeTrainings", value: 0, unit: "count" },
          { id: "totalTrainees", label: "dashboard.dept.kpi.totalTrainees", value: 0, unit: "count" },
          { id: "certificatesIssued", label: "dashboard.dept.kpi.certificatesIssued", value: 0, unit: "count" },
          { id: "revenueThisMonth", label: "dashboard.dept.kpi.revenueThisMonth", value: 0, unit: "currency" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "formation", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "consultation": {
      data = {
        stats: [
          { id: "activeMissions", label: "dashboard.dept.kpi.activeMissions", value: 0, unit: "count" },
          { id: "completedMissions", label: "dashboard.dept.kpi.completedMissions", value: 0, unit: "count" },
          { id: "totalClients", label: "dashboard.dept.kpi.totalClients", value: 0, unit: "count" },
          { id: "revenueThisMonth", label: "dashboard.dept.kpi.revenueThisMonth", value: 0, unit: "currency" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "consultation", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "marketing": {
      data = {
        stats: [],
        charts: [],
        alerts: [{ id: "placeholder", level: "info", message: "dashboard.dept.health.placeholder" }],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "marketing", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    case "logistique": {
      data = {
        stats: [
          { id: "totalItems", label: "dashboard.dept.kpi.totalItems", value: 0, unit: "count" },
          { id: "lowStockItems", label: "dashboard.dept.kpi.lowStockItems", value: 0, unit: "count" },
          { id: "pendingOrders", label: "dashboard.dept.kpi.pendingOrders", value: 0, unit: "count" },
        ],
        charts: [],
        alerts: [],
        activity: [],
        health: { status: "placeholder", notes: ["dashboard.dept.health.placeholder"] },
        metadata: { source: "logistique", generatedAt: new Date().toISOString(), placeholder: true },
      };
      break;
    }

    default:
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  return NextResponse.json({
    dept: deptKey,
    data,
    lastUpdated: new Date().toISOString(),
  });
}

