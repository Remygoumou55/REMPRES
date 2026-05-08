import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";

export async function GET(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [admin, superAdmin] = await Promise.all([isAdminRole(user.id), isSuperAdmin(user.id)]);
  if (!admin && !superAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dept = String(searchParams.get("dept") ?? "")
    .trim()
    .toUpperCase();

  const supabase = getSupabaseServerClient();

  const [clientsRes, productsRes, salesRes, usersRes, lastActivityRes] = await Promise.all([
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("module_key", "clients"),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("module_key", "products"),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .in("module_key", ["sales", "vente"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("department_key", dept).is("deleted_at", null),
    supabase
      .from("activity_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    dept,
    clientsCount: clientsRes.count ?? 0,
    productsCount: productsRes.count ?? 0,
    salesCount: salesRes.count ?? 0,
    activeUsers: usersRes.count ?? 0,
    lastActivity: lastActivityRes.data?.created_at ?? null,
  });
}

