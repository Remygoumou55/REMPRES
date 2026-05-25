/**
 * P7.1 — Mutations congés gouvernées : gate → write → publisher → audit.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import { isValidHrLeaveType } from "@/lib/hr/constants/hr-leave-types";
import {
  emitHrLeaveApproved,
  emitHrLeaveRejected,
  emitHrLeaveRequested,
} from "@/lib/erp-core/events/integrations/hr-events";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";
import { canOperateRhDomain } from "@/modules/hr/server/security/rh-operational-access";

export type SubmitHrLeaveInput = {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
};

export async function submitHrLeaveRequest(
  userId: string,
  input: SubmitHrLeaveInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canCreate) {
    return { success: false, error: "Action non autorisee." };
  }

  const employeeId = String(input.employeeId ?? "").trim();
  const leaveType = String(input.leaveType ?? "").trim().toLowerCase();
  const startDate = String(input.startDate ?? "").trim();
  const endDate = String(input.endDate ?? "").trim();
  const reason = String(input.reason ?? "").trim();
  const validLeaveTypes = new Set(["annual", "sick", "special", "unpaid"]);

  if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
    return { success: false, error: "Veuillez remplir tous les champs obligatoires." };
  }
  if (!isValidHrLeaveType(leaveType) || !validLeaveTypes.has(leaveType)) {
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

  const supabase = getSupabaseServerClient();
  const [actorCanOperateRh, employeeProfile] = await Promise.all([
    canOperateRhDomain(userId, perms),
    supabase
      .from("profiles")
      .select("id,is_active,deleted_at,department_key")
      .eq("id", employeeId)
      .maybeSingle(),
  ]);

  if (employeeProfile.error || !employeeProfile.data || employeeProfile.data.deleted_at || !employeeProfile.data.is_active) {
    return { success: false, error: "Collaborateur cible introuvable ou inactif." };
  }

  const isSelfRequest = employeeId === userId;
  if (!isSelfRequest && !actorCanOperateRh) {
    return { success: false, error: "Vous ne pouvez pas soumettre une demande pour ce collaborateur." };
  }

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.LEAVE_REQUEST, "create");
  } catch {
    return { success: false, error: "Action non autorisee." };
  }

  const leaveInsert = await supabase
    .from("rh_leave_requests")
    .insert({
      employee_id: employeeId,
      leave_type: leaveType as "annual" | "sick" | "special" | "unpaid",
      start_date: startDate,
      end_date: endDate,
      reason,
      requested_by: userId,
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
    requested_by: userId,
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

  await Promise.all([
    emitHrLeaveRequested({
      actorUserId: userId,
      leaveId,
      employeeId,
      leaveType,
      startDate,
      endDate,
      status: "pending",
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.LEAVE_REQUEST,
      entityType: "leave_request",
      entityId: leaveId,
      afterSnapshot: {
        leave_id: leaveId,
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        status: "pending",
      },
    }),
  ]);

  await supabase.from("activity_logs").insert({
    actor_user_id: userId,
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

  return { success: true };
}

export async function updateHrLeaveStatus(
  userId: string,
  input: { leaveRequestId: string; status: "approved" | "rejected" | "cancelled"; rejectionReason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canUpdate) return { success: false, error: "Action non autorisee." };

  const leaveRequestId = String(input.leaveRequestId ?? "").trim();
  if (!leaveRequestId) return { success: false, error: "Demande invalide." };

  const nextStatus = input.status;
  const allowed = new Set(["approved", "rejected", "cancelled"]);
  if (!allowed.has(nextStatus)) return { success: false, error: "Statut invalide." };

  const canOperateRh = await canOperateRhDomain(userId, perms);
  if (!canOperateRh) return { success: false, error: "Action reservee aux responsables RH." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.LEAVE_STATUS_UPDATE, "update");
  } catch {
    return { success: false, error: "Action non autorisee." };
  }

  const supabase = getSupabaseServerClient();
  const leaveResult = await supabase
    .from("rh_leave_requests")
    .select("id,status,approval_request_id,employee_id")
    .eq("id", leaveRequestId)
    .maybeSingle();
  if (leaveResult.error || !leaveResult.data) return { success: false, error: "Demande introuvable." };

  if (leaveResult.data.status !== "pending") {
    return { success: false, error: "Cette demande a deja ete traitee." };
  }

  const fromStatus = leaveResult.data.status;
  const employeeId = String(leaveResult.data.employee_id ?? "");

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
        approved_by: nextStatus === "approved" ? userId : null,
        approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
        rejected_at: nextStatus === "rejected" ? new Date().toISOString() : null,
        rejection_reason: nextStatus === "rejected" ? String(input.rejectionReason ?? "").trim() || null : null,
      })
      .eq("id", leaveResult.data.approval_request_id);
  }

  const postWriteTasks: Promise<unknown>[] = [
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.LEAVE_STATUS_UPDATE,
      entityType: "leave_request",
      entityId: leaveRequestId,
      beforeSnapshot: { status: fromStatus },
      afterSnapshot: { status: nextStatus, employee_id: employeeId },
    }),
  ];

  if (nextStatus === "approved" && employeeId) {
    postWriteTasks.push(
      emitHrLeaveApproved({
        actorUserId: userId,
        leaveId: leaveRequestId,
        employeeId,
        fromStatus,
        toStatus: nextStatus,
        approverId: userId,
        approvalRequestId: leaveResult.data.approval_request_id,
      }),
    );
  }

  if (nextStatus === "rejected" && employeeId) {
    postWriteTasks.push(
      emitHrLeaveRejected({
        actorUserId: userId,
        leaveId: leaveRequestId,
        employeeId,
        rejectionReason: input.rejectionReason ?? null,
      }),
    );
  }

  await Promise.all(postWriteTasks);

  await supabase.from("activity_logs").insert({
    actor_user_id: userId,
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
      triggered_by: userId,
      metadata: { rejection_reason: input.rejectionReason ?? null },
    });
  }

  return { success: true };
}
