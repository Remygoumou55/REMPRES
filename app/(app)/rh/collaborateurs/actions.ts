"use server";

import { redirect } from "next/navigation";
import { revalidateRH } from "@/lib/cache/revalidation-map";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getUserRole } from "@/lib/server/permissions";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite, canRhDelete } from "@/lib/server/rh-access";
import {
  createEmployee,
  getEmployeeById,
  setEmployeeActive,
  softDeleteEmployee,
  updateEmployee,
} from "@/lib/server/rh";
import type { ContractType } from "@/lib/types/rh";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

function boolField(formData: FormData, name: string): boolean {
  const v = formData.get(name);
  if (v === null) return false;
  return v === "on" || v === "true" || v === "1";
}

export async function createEmployeeAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const result = await createEmployee({
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    address: field(formData, "address") || undefined,
    position: field(formData, "position"),
    department: field(formData, "department"),
    hire_date: field(formData, "hire_date"),
    salary_gnf: Number(field(formData, "salary_gnf")) || 0,
    contract_type: (field(formData, "contract_type") || "cdi") as ContractType,
    is_active: boolField(formData, "is_active"),
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(`/rh/collaborateurs/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(
    `/rh/collaborateurs?success=${encodeURIComponent("Collaborateur ajouté avec succès.")}`,
  );
}

export async function updateEmployeeAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const result = await updateEmployee(id, {
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    address: field(formData, "address") || undefined,
    position: field(formData, "position"),
    department: field(formData, "department"),
    hire_date: field(formData, "hire_date"),
    salary_gnf: Number(field(formData, "salary_gnf")) || 0,
    contract_type: (field(formData, "contract_type") || "cdi") as ContractType,
    is_active: boolField(formData, "is_active"),
    notes: field(formData, "notes") || undefined,
  });

  if (!result.success) {
    redirect(`/rh/collaborateurs/${id}/edit?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(
    `/rh/collaborateurs/${id}?success=${encodeURIComponent("Collaborateur mis à jour.")}`,
  );
}

export async function deactivateEmployeeAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);
  await setEmployeeActive(id, false);
  await revalidateRH();
  redirect(
    `/rh/collaborateurs?success=${encodeURIComponent("Collaborateur désactivé.")}`,
  );
}

export async function reactivateEmployeeAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);
  await setEmployeeActive(id, true);
  await revalidateRH();
  redirect(
    `/rh/collaborateurs/${id}?success=${encodeURIComponent("Collaborateur réactivé.")}`,
  );
}

export async function deleteEmployeeAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canRhDelete(user.id))) redirect("/access-denied");

  const employee = await getEmployeeById(id);
  const label = employee ? `${employee.first_name} ${employee.last_name}` : id;
  const [profile, roleKey] = await Promise.all([
    getCachedProfileRow(user.id),
    getUserRole(user.id),
  ]);

  const result = await createApprovalRequest({
    requestedBy: user.id,
    requesterName: profile.displayName || "Responsable RH",
    requesterRole: roleKey || profile.roleKey || "",
    requesterDept: "Ressources Humaines",
    actionType: SENSITIVE_ACTIONS.DELETE_EMPLOYEE.type,
    module: SENSITIVE_ACTIONS.DELETE_EMPLOYEE.module,
    targetId: id,
    targetLabel: label,
    description: SENSITIVE_ACTIONS.DELETE_EMPLOYEE.description(label),
    actionPayload: { id, table: "employees", operation: "soft_delete" },
    priority: SENSITIVE_ACTIONS.DELETE_EMPLOYEE.priority,
  });

  if (!result.success) {
    redirect(
      `/rh/collaborateurs/${id}?error=${encodeURIComponent("Erreur lors de la demande")}`,
    );
  }
  redirect(
    `/rh/collaborateurs?success=${encodeURIComponent("Demande envoyée. En attente d'approbation du Super Admin.")}`,
  );
}

export async function softDeleteEmployeeDirectAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canRhDelete(user.id))) redirect("/access-denied");
  await softDeleteEmployee(id);
  await revalidateRH();
  redirect(
    `/rh/collaborateurs?success=${encodeURIComponent("Collaborateur supprimé.")}`,
  );
}
