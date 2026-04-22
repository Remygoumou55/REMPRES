import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { exportActivityLogsCsv, type ActivityLogsFilters } from "@/lib/server/activity-logs";
import { isSuperAdmin } from "@/lib/server/permissions";

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: ActivityLogsFilters = {
    moduleKey: url.searchParams.get("moduleKey") ?? undefined,
    actionKey: url.searchParams.get("actionKey") ?? undefined,
    actorUserId: url.searchParams.get("actorUserId") ?? undefined,
    targetId: url.searchParams.get("targetId") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  const csv = await exportActivityLogsCsv(filters);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="activity-logs.csv"',
    },
  });
}
