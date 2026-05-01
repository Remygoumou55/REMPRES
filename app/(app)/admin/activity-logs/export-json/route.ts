import { NextResponse } from "next/server";
import {
  exportActivityLogsSignedJson,
  type ActivityLogsFilters,
} from "@/lib/server/activity-logs";
import { isAdminRole } from "@/lib/server/permissions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const allowed = await isAdminRole(data.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
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

  const exportData = await exportActivityLogsSignedJson(filters);
  return NextResponse.json(exportData, {
    status: 200,
    headers: {
      "Content-Disposition": 'attachment; filename="activity-logs-signed.json"',
    },
  });
}
