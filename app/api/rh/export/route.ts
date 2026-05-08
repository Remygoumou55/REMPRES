import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { insertActivityLog } from "@/lib/server/insert-activity-log";

function csvEscape(value: string | number | null | undefined): string {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

type LeaveRow = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  requested_by: string;
  created_at: string;
};

type AttendanceRow = {
  id: string;
  employee_id: string;
  event_type: string;
  event_at: string;
  source: string;
  recorded_by: string;
  created_at: string;
};

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const perms = await getModulePermissions(auth.user.id, ["rh"]);
  if (!perms.canRead) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const url = new URL(request.url);
  const section = String(url.searchParams.get("section") ?? "all").toLowerCase();
  const status = String(url.searchParams.get("status") ?? "").toLowerCase();
  const startDate = String(url.searchParams.get("from") ?? "").trim();
  const endDate = String(url.searchParams.get("to") ?? "").trim();

  const includeLeaves = section === "all" || section === "leaves";
  const includeAttendance = section === "all" || section === "attendance";
  const allowedStatus = ["pending", "approved", "rejected", "cancelled"] as const;
  const isAllowedStatus = (value: string): value is (typeof allowedStatus)[number] =>
    (allowedStatus as readonly string[]).includes(value);
  const leavesQuery = supabase
    .from("rh_leave_requests")
    .select("id,employee_id,leave_type,start_date,end_date,status,requested_by,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (isAllowedStatus(status)) leavesQuery.eq("status", status);
  if (startDate) leavesQuery.gte("start_date", startDate);
  if (endDate) leavesQuery.lte("end_date", endDate);

  const attendanceQuery = supabase
    .from("rh_attendance_events")
    .select("id,employee_id,event_type,event_at,source,recorded_by,created_at")
    .order("event_at", { ascending: false })
    .limit(1000);
  if (startDate) attendanceQuery.gte("event_at", `${startDate}T00:00:00.000Z`);
  if (endDate) attendanceQuery.lte("event_at", `${endDate}T23:59:59.999Z`);

  const [leaves, attendance] = await Promise.all([
    includeLeaves ? leavesQuery : Promise.resolve({ data: [] as LeaveRow[] }),
    includeAttendance ? attendanceQuery : Promise.resolve({ data: [] as AttendanceRow[] }),
  ]);

  const headerLeaves = "section,id,employee_id,leave_type,start_date,end_date,status,requested_by,created_at";
  const rowsLeaves = (leaves.data ?? []).map((row) =>
    [
      "leave",
      row.id,
      row.employee_id,
      row.leave_type,
      row.start_date,
      row.end_date,
      row.status,
      row.requested_by,
      row.created_at,
    ]
      .map(csvEscape)
      .join(","),
  );

  const headerAttendance = "section,id,employee_id,event_type,event_at,source,recorded_by,created_at";
  const rowsAttendance = (attendance.data ?? []).map((row) =>
    [
      "attendance",
      row.id,
      row.employee_id,
      row.event_type,
      row.event_at,
      row.source,
      row.recorded_by,
      row.created_at,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csvBlocks: string[] = [];
  if (includeLeaves) csvBlocks.push(headerLeaves, ...rowsLeaves);
  if (includeAttendance) csvBlocks.push(...(csvBlocks.length ? [""] : []), headerAttendance, ...rowsAttendance);
  const csv = csvBlocks.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  await insertActivityLog({
    actorUserId: auth.user.id,
    moduleKey: "rh",
    actionKey: "export",
    targetTable: "rh_export",
    targetId: null,
    metadata: { section, status: status || null, from: startDate || null, to: endDate || null },
  }).catch(() => undefined);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rh-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

