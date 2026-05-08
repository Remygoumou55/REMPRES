import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";

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

  let data: Record<string, unknown> = {};

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
        clientsCount,
        productsCount,
        lowStockCount,
        salesToday: salesTodayRows.length,
        salesThisMonth,
        salesLast7Days,
        topProducts: topProductsRows.map((p) => ({ name: p.name, salesCount: 0 })),
        recentActivity: recentActivityRows,
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
      data = {
        totalRevenueMonth,
        totalExpensesMonth,
        netMargin: totalRevenueMonth - totalExpensesMonth,
        transactionsCount: transactionsRows,
        last7DaysRevenue: Array.from(byDay.entries()).map(([date, value]) => ({
          date,
          revenue: value.revenue,
          expenses: value.expenses,
        })),
        recentExpenses: expensesRows.slice(-5),
      };
      break;
    }

    case "rh": {
      const [activeEmployees, recentHires] = await Promise.all([
        safeCount(
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .neq("role_key", "super_admin")
            .neq("role_key", "directeur_general"),
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
        activeEmployees,
        presentToday: 0,
        pendingLeaves: 0,
        recentHires,
      };
      break;
    }

    case "formation": {
      data = {
        activeTrainings: 0,
        totalTrainees: 0,
        certificatesIssued: 0,
        enrollmentsThisMonth: 0,
        revenueThisMonth: 0,
      };
      break;
    }

    case "consultation": {
      data = {
        activeMissions: 0,
        completedMissions: 0,
        totalClients: 0,
        revenueThisMonth: 0,
      };
      break;
    }

    case "marketing": {
      data = { message: "Module en cours de développement", placeholder: true };
      break;
    }

    case "logistique": {
      data = {
        totalItems: 0,
        lowStockItems: 0,
        pendingOrders: 0,
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

