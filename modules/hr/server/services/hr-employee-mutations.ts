/**
 * P7.1 — Mutations collaborateur gouvernées : gate → write → publisher → audit.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import {
  emitHrEmployeeStatusChanged,
  emitHrEmployeeUpdated,
} from "@/lib/erp-core/events/integrations/hr-events";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";

export async function updateHrEmployeeRole(
  userId: string,
  input: { employeeId: string; roleKey: string; departmentKey: string | null },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.EMPLOYEE_ROLE_UPDATE, "update");
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("profiles")
    .select("role_key,department_key")
    .eq("id", input.employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  const update = await supabase
    .from("profiles")
    .update({
      role_key: String(input.roleKey ?? "").trim(),
      department_key: input.departmentKey,
    })
    .eq("id", input.employeeId)
    .is("deleted_at", null);
  if (update.error) {
    return { success: false, error: "Mise a jour role/departement impossible." };
  }

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "role_changed",
    event_label: "Role or department changed",
    payload: { role_key: input.roleKey, department_key: input.departmentKey },
    created_by: userId,
  });

  await Promise.all([
    emitHrEmployeeUpdated({
      actorUserId: userId,
      employeeId: input.employeeId,
      field: "role_department",
      fromValue: before ? `${before.role_key}/${before.department_key}` : null,
      toValue: `${input.roleKey}/${input.departmentKey}`,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.EMPLOYEE_ROLE_UPDATE,
      entityType: "profiles",
      entityId: input.employeeId,
      beforeSnapshot: before ?? null,
      afterSnapshot: { role_key: input.roleKey, department_key: input.departmentKey },
    }),
  ]);

  return { success: true };
}

export async function updateHrEmployeeManager(
  userId: string,
  input: {
    employeeId: string;
    managerId: string | null;
    title: string | null;
    departmentKey: string | null;
  },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.EMPLOYEE_MANAGER_UPDATE, "update");
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("rh_employee_hierarchy")
    .select("manager_id,title,department_key")
    .eq("employee_id", input.employeeId)
    .maybeSingle();

  const upsert = await supabase.from("rh_employee_hierarchy").upsert(
    {
      employee_id: input.employeeId,
      manager_id: input.managerId,
      title: input.title,
      department_key: input.departmentKey,
      created_by: userId,
      active: true,
    },
    { onConflict: "employee_id" },
  );
  if (upsert.error) return { success: false, error: "Mise a jour manager impossible." };

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "manager_changed",
    event_label: "Manager or hierarchy updated",
    payload: {
      manager_id: input.managerId,
      title: input.title,
      department_key: input.departmentKey,
    },
    created_by: userId,
  });

  await Promise.all([
    emitHrEmployeeUpdated({
      actorUserId: userId,
      employeeId: input.employeeId,
      field: "manager",
      fromValue: before?.manager_id ?? null,
      toValue: input.managerId,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.EMPLOYEE_MANAGER_UPDATE,
      entityType: "profiles",
      entityId: input.employeeId,
      beforeSnapshot: before ?? null,
      afterSnapshot: {
        manager_id: input.managerId,
        title: input.title,
        department_key: input.departmentKey,
      },
    }),
  ]);

  return { success: true };
}

export async function updateHrEmployeeEmploymentStatus(
  userId: string,
  input: { employeeId: string; isActive: boolean },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.EMPLOYEE_STATUS_UPDATE, "update");
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("profiles")
    .select("is_active,role_key")
    .eq("id", input.employeeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!before) return { success: false, error: "Collaborateur introuvable." };
  if (before.is_active === input.isActive) {
    return { success: false, error: "Le statut est deja a jour." };
  }

  const update = await supabase
    .from("profiles")
    .update({ is_active: input.isActive })
    .eq("id", input.employeeId)
    .is("deleted_at", null);
  if (update.error) return { success: false, error: "Mise a jour statut impossible." };

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "employment_status_changed",
    event_label: input.isActive ? "Collaborateur active" : "Collaborateur desactive",
    payload: { is_active: input.isActive, previous: before.is_active },
    created_by: userId,
  });

  await Promise.all([
    emitHrEmployeeStatusChanged({
      actorUserId: userId,
      employeeId: input.employeeId,
      fromActive: before.is_active,
      toActive: input.isActive,
    }),
    emitHrEmployeeUpdated({
      actorUserId: userId,
      employeeId: input.employeeId,
      field: "is_active",
      fromValue: String(before.is_active),
      toValue: String(input.isActive),
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.EMPLOYEE_STATUS_UPDATE,
      entityType: "profiles",
      entityId: input.employeeId,
      beforeSnapshot: { is_active: before.is_active },
      afterSnapshot: { is_active: input.isActive },
    }),
  ]);

  return { success: true };
}
