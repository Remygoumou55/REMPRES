/**
 * Bloc 3 — Mutations présence gouvernées : gate → write → bus → audit.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import { emitHrAttendanceRecorded } from "@/lib/erp-core/events/integrations/hr-events";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";

export type RecordHrAttendanceInput = {
  eventType: "check_in" | "check_out";
  notes?: string;
  employeeId?: string;
};

export async function recordHrAttendance(
  userId: string,
  input: RecordHrAttendanceInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canCreate && !perms.canUpdate) {
    return { success: false, error: "Action non autorisee." };
  }

  const eventType = input.eventType;
  if (eventType !== "check_in" && eventType !== "check_out") {
    return { success: false, error: "Type de pointage invalide." };
  }

  const targetEmployeeId = String(input.employeeId ?? userId).trim();
  if (!targetEmployeeId) return { success: false, error: "Collaborateur invalide." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.ATTENDANCE_RECORD, "create");
  } catch {
    return { success: false, error: "Action non autorisee." };
  }

  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,is_active,deleted_at")
    .eq("id", targetEmployeeId)
    .maybeSingle();

  if (!profile || profile.deleted_at || !profile.is_active) {
    return { success: false, error: "Collaborateur introuvable ou inactif." };
  }

  if (targetEmployeeId !== userId && !perms.canUpdate) {
    return { success: false, error: "Pointage pour un autre collaborateur reserve aux responsables RH." };
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { data: lastEvent } = await supabase
    .from("rh_attendance_events")
    .select("event_type,event_at")
    .eq("employee_id", targetEmployeeId)
    .gte("event_at", dayStart.toISOString())
    .order("event_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastEvent?.event_type === eventType) {
    return { success: false, error: "Evenement deja enregistre pour ce type de pointage." };
  }

  const insert = await supabase
    .from("rh_attendance_events")
    .insert({
      employee_id: targetEmployeeId,
      event_type: eventType,
      source: "erp",
      notes: String(input.notes ?? "").trim() || null,
      recorded_by: userId,
    })
    .select("id,event_at")
    .single();

  if (insert.error || !insert.data) {
    return { success: false, error: "Impossible d'enregistrer la presence pour le moment." };
  }

  await Promise.all([
    emitHrAttendanceRecorded({
      actorUserId: userId,
      attendanceId: insert.data.id,
      employeeId: targetEmployeeId,
      eventType,
      eventAt: insert.data.event_at,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.ATTENDANCE_RECORD,
      entityType: "rh_attendance_events",
      entityId: insert.data.id,
      afterSnapshot: {
        employee_id: targetEmployeeId,
        event_type: eventType,
        event_at: insert.data.event_at,
      },
    }),
  ]);

  await supabase.from("activity_logs").insert({
    actor_user_id: userId,
    module_key: "rh",
    action_key: eventType === "check_in" ? "attendance_check_in" : "attendance_check_out",
    target_table: "rh_attendance_events",
    target_id: insert.data.id,
    metadata: { event_type: eventType, employee_id: targetEmployeeId },
  });

  return { success: true };
}
