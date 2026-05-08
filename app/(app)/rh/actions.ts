"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, getProfileAuthBrief, isAdminRole } from "@/lib/server/permissions";
import { revalidateRhScope } from "@/lib/server/revalidate-domains";

async function canOperateRhDomain(userId: string, perms: { canUpdate: boolean }) {
  const [adminRole, brief] = await Promise.all([isAdminRole(userId), getProfileAuthBrief(userId)]);
  const isRhManager =
    String(brief.departmentKey ?? "").trim().toUpperCase() === "RH" &&
    String(brief.roleKey ?? "").trim().toLowerCase() === "manager";
  return adminRole || isRhManager || perms.canUpdate;
}

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

  const perms = await getModulePermissions(data.user.id, ["rh"]);
  if (!perms.canCreate) {
    return { success: false, error: "Action non autorisee." };
  }

  const employeeId = String(input.employeeId ?? "").trim();
  const leaveType = String(input.leaveType ?? "").trim().toLowerCase();
  const startDate = String(input.startDate ?? "").trim();
  const endDate = String(input.endDate ?? "").trim();
  const reason = String(input.reason ?? "").trim();
  const validLeaveTypes = new Set(["paid", "sick", "exceptional"]);

  if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
    return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
  }
  if (!validLeaveTypes.has(leaveType)) {
    return { success: false, error: "Type de conge invalide." };
  }
  if (reason.length < 8 || reason.length > 1000) {
    return { success: false, error: "Le motif doit contenir entre 8 et 1000 caracteres." };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { success: false, error: "Dates invalides." };
  }
  if (startDate > endDate) {
    return { success: false, error: "La date de fin doit etre posterieure a la date de debut." };
  }
  const leaveDurationDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (leaveDurationDays > 180) {
    return { success: false, error: "La demande depasse la duree maximale autorisee (180 jours)." };
  }

  const [actorCanOperateRh, employeeProfile] = await Promise.all([
    canOperateRhDomain(data.user.id, perms),
    supabase
      .from("profiles")
      .select("id,is_active,deleted_at,department_key")
      .eq("id", employeeId)
      .maybeSingle(),
  ]);

  if (employeeProfile.error || !employeeProfile.data || employeeProfile.data.deleted_at || !employeeProfile.data.is_active) {
    return { success: false, error: "Collaborateur cible introuvable ou inactif." };
  }

  const isSelfRequest = employeeId === data.user.id;
  if (!isSelfRequest && !actorCanOperateRh) {
    return { success: false, error: "Vous ne pouvez pas soumettre une demande pour ce collaborateur." };
  }

  const leaveInsert = await supabase
    .from("rh_leave_requests")
    .insert({
      employee_id: employeeId,
      leave_type: leaveType as "paid" | "sick" | "exceptional",
      start_date: startDate,
      end_date: endDate,
      reason,
      requested_by: data.user.id,
    })
    .select("id")
    .single();

  if (leaveInsert.error || !leaveInsert.data) {
    return { success: false, error: "Impossible d'enregistrer la demande de conge pour le moment." };
  }

  const leaveId = leaveInsert.data.id;
  const approvalInsert = await supabase.from("approval_requests").insert({
    department_key: "rh",
    action_type: "leave_request",
    entity_type: "leave_request",
    entity_id: leaveId,
    requested_by: data.user.id,
    reason,
    payload_snapshot: {
      leave_request_id: leaveId,
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
    },
  });

  if (approvalInsert.error) {
    await supabase.from("rh_leave_requests").delete().eq("id", leaveId);
    return { success: false, error: "Impossible d'enregistrer la demande de conge pour le moment." };
  }

  const { data: approvalData } = await supabase
    .from("approval_requests")
    .select("id")
    .eq("entity_id", leaveId)
    .eq("entity_type", "leave_request")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approvalData?.id) {
    await supabase
      .from("rh_leave_requests")
      .update({ approval_request_id: approvalData.id })
      .eq("id", leaveId);
  }

  await supabase.from("activity_logs").insert({
    actor_user_id: data.user.id,
    module_key: "rh",
    action_key: "leave_request_submitted",
    target_table: "rh_leave_requests",
    target_id: leaveId,
    metadata: {
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
    },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true };
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

  revalidateRhScope({ includeDashboard: true });
  return { success: true };
}

export async function updateRhLeaveStatusAction(
  input: { leaveRequestId: string; status: "approved" | "rejected" | "cancelled"; rejectionReason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const perms = await getModulePermissions(data.user.id, ["rh"]);
  if (!perms.canUpdate) return { success: false, error: "Action non autorisee." };

  const leaveRequestId = String(input.leaveRequestId ?? "").trim();
  if (!leaveRequestId) return { success: false, error: "Demande invalide." };

  const nextStatus = input.status;
  const allowed = new Set(["approved", "rejected", "cancelled"]);
  if (!allowed.has(nextStatus)) return { success: false, error: "Statut invalide." };

  const canOperateRh = await canOperateRhDomain(data.user.id, perms);
  if (!canOperateRh) return { success: false, error: "Action reservee aux responsables RH." };

  const leaveResult = await supabase
    .from("rh_leave_requests")
    .select("id,status,approval_request_id")
    .eq("id", leaveRequestId)
    .maybeSingle();
  if (leaveResult.error || !leaveResult.data) return { success: false, error: "Demande introuvable." };

  if (leaveResult.data.status !== "pending") {
    return { success: false, error: "Cette demande a deja ete traitee." };
  }

  const updated = await supabase
    .from("rh_leave_requests")
    .update({ status: nextStatus })
    .eq("id", leaveRequestId);
  if (updated.error) return { success: false, error: "Impossible de mettre a jour la demande." };

  if (leaveResult.data.approval_request_id) {
    await supabase
      .from("approval_requests")
      .update({
        status: nextStatus === "approved" ? "approved" : nextStatus === "rejected" ? "rejected" : "expired",
        approved_by: nextStatus === "approved" ? data.user.id : null,
        approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
        rejected_at: nextStatus === "rejected" ? new Date().toISOString() : null,
        rejection_reason: nextStatus === "rejected" ? String(input.rejectionReason ?? "").trim() || null : null,
      })
      .eq("id", leaveResult.data.approval_request_id);
  }

  await supabase.from("activity_logs").insert({
    actor_user_id: data.user.id,
    module_key: "rh",
    action_key: `leave_request_${nextStatus}`,
    target_table: "rh_leave_requests",
    target_id: leaveRequestId,
    metadata: { status: nextStatus, rejection_reason: input.rejectionReason ?? null },
  });

  if (nextStatus === "rejected") {
    await supabase.from("governance_alerts").insert({
      type: "rh_leave_request_rejected",
      severity: "medium",
      department_key: "rh",
      title: "Demande de conge rejetee",
      description: "Une demande de conge RH a ete rejetee.",
      entity_type: "rh_leave_requests",
      entity_id: leaveRequestId,
      triggered_by: data.user.id,
      metadata: { rejection_reason: input.rejectionReason ?? null },
    });
  }

  revalidateRhScope({ includeDashboard: true });
  return { success: true };
}

