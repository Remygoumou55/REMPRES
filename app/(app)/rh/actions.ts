"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { revalidateRH } from "@/lib/cache/revalidation-map";
import {
  submitHrLeaveRequest,
  updateHrLeaveStatus,
} from "@/modules/hr/server/services/hr-leave-mutations";

export async function submitRhLeaveRequestAction(
  input: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await submitHrLeaveRequest(data.user.id, input);
  if (result.success) {
    await revalidateRH();
  }
  return result;
}

export async function submitRhAttendanceAction(
  input: { eventType: "check_in" | "check_out"; notes?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["rh"]);
  if (!perms.canCreate && !perms.canUpdate) {
    return { success: false, error: "Action non autorisee." };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("is_active,deleted_at")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!actorProfile || actorProfile.deleted_at || !actorProfile.is_active) {
    return { success: false, error: "Profil utilisateur inactif." };
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { data: lastEvent } = await supabase
    .from("rh_attendance_events")
    .select("event_type,event_at")
    .eq("employee_id", data.user.id)
    .gte("event_at", dayStart.toISOString())
    .order("event_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastEvent?.event_type === input.eventType) {
    return { success: false, error: "Evenement deja enregistre pour ce type de pointage." };
  }

  const { error } = await supabase.from("rh_attendance_events").insert({
    employee_id: data.user.id,
    event_type: input.eventType,
    source: "erp",
    notes: String(input.notes ?? "").trim() || null,
    recorded_by: data.user.id,
  });

  if (error) {
    return { success: false, error: "Impossible d'enregistrer la presence pour le moment." };
  }

  await supabase.from("activity_logs").insert({
    actor_user_id: data.user.id,
    module_key: "rh",
    action_key: input.eventType === "check_in" ? "attendance_check_in" : "attendance_check_out",
    target_table: "rh_attendance_events",
    target_id: null,
    metadata: { event_type: input.eventType, source: "erp" },
  });

  await revalidateRH();
  return { success: true };
}

export async function updateRhLeaveStatusAction(
  input: { leaveRequestId: string; status: "approved" | "rejected" | "cancelled"; rejectionReason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await updateHrLeaveStatus(data.user.id, input);
  if (result.success) {
    await revalidateRH();
  }
  return result;
}
