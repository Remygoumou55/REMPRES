"use server";

import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { canManageEmployeeDomain } from "@/modules/hr/employees/server/security/access";
import { getEmployeeDomainDetails } from "@/modules/hr/employees/server/services/employee-service";
import { validateEmployeeDocumentType, validateEmployeeId } from "@/modules/hr/employees/server/validators/employee";

export async function loadEmployeeDomainDetailsAction(employeeId: string) {
  const actor = await getServerSessionUser();
  if (!actor) {
    return { success: false as const, error: "Utilisateur non authentifie." };
  }
  if (!validateEmployeeId(employeeId)) {
    return { success: false as const, error: "Employee id invalide." };
  }
  const details = await getEmployeeDomainDetails(employeeId);
  return { success: true as const, data: details };
}

export async function updateEmployeeRoleAssignmentAction(input: {
  employeeId: string;
  roleKey: string;
  departmentKey: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!validateEmployeeId(input.employeeId)) {
    return { success: false as const, error: "Employee id invalide." };
  }
  if (!(await canManageEmployeeDomain(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const update = await supabase
    .from("profiles")
    .update({
      role_key: String(input.roleKey ?? "").trim(),
      department_key: input.departmentKey,
    })
    .eq("id", input.employeeId)
    .is("deleted_at", null);
  if (update.error) {
    return { success: false as const, error: "Mise a jour role/departement impossible." };
  }

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "role_changed",
    event_label: "Role or department changed",
    payload: { role_key: input.roleKey, department_key: input.departmentKey },
    created_by: actor.id,
  });

  return { success: true as const };
}

export async function updateEmployeeManagerAction(input: {
  employeeId: string;
  managerId: string | null;
  title: string | null;
  departmentKey: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!validateEmployeeId(input.employeeId)) return { success: false as const, error: "Employee id invalide." };
  if (input.managerId && !validateEmployeeId(input.managerId)) return { success: false as const, error: "Manager id invalide." };
  if (!(await canManageEmployeeDomain(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const upsert = await supabase.from("rh_employee_hierarchy").upsert(
    {
      employee_id: input.employeeId,
      manager_id: input.managerId,
      title: input.title,
      department_key: input.departmentKey,
      created_by: actor.id,
      active: true,
    },
    { onConflict: "employee_id" },
  );
  if (upsert.error) return { success: false as const, error: "Mise a jour manager impossible." };

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "manager_changed",
    event_label: "Manager or hierarchy updated",
    payload: { manager_id: input.managerId, title: input.title, department_key: input.departmentKey },
    created_by: actor.id,
  });
  return { success: true as const };
}

export async function createEmployeeDocumentAction(input: {
  employeeId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!validateEmployeeId(input.employeeId)) return { success: false as const, error: "Employee id invalide." };
  if (!validateEmployeeDocumentType(String(input.documentType ?? "").trim())) {
    return { success: false as const, error: "Type de document invalide." };
  }
  if (!(await canManageEmployeeDomain(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const insert = await supabase.from("rh_employee_documents").insert({
    employee_id: input.employeeId,
    uploaded_by: actor.id,
    document_type: input.documentType,
    file_name: String(input.fileName ?? "").trim(),
    storage_path: String(input.storagePath ?? "").trim(),
    mime_type: input.mimeType ?? null,
    file_size_bytes: input.fileSizeBytes ?? null,
    metadata: {},
  });
  if (insert.error) return { success: false as const, error: "Creation document impossible." };

  await supabase.from("rh_employee_history").insert({
    employee_id: input.employeeId,
    event_type: "document_uploaded",
    event_label: "Employee document uploaded",
    payload: { document_type: input.documentType, file_name: input.fileName },
    created_by: actor.id,
  });

  return { success: true as const };
}

