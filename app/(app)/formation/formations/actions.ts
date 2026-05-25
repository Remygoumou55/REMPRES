"use server";

import { redirect } from "next/navigation";
import { revalidateFormation } from "@/lib/cache/revalidation-map";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getUserRole } from "@/lib/server/permissions";
import { assertFormationWrite, canFormationDelete } from "@/lib/server/formation-access";
import {
  createTraining,
  getTrainingById,
  softDeleteTraining,
  updateTraining,
} from "@/lib/server/formation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import type { TrainingStatus } from "@/lib/types/formation";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createTrainingAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  const result = await createTraining({
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    category: field(formData, "category") || undefined,
    duration_hours: Number(field(formData, "duration_hours")) || 0,
    price_gnf: Number(field(formData, "price_gnf")) || 0,
    max_participants: Number(field(formData, "max_participants")) || 20,
    instructor_name: field(formData, "instructor_name") || undefined,
    location: field(formData, "location") || undefined,
    status: (field(formData, "status") || "draft") as TrainingStatus,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(`/formation/formations/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateFormation();
  redirect(`/formation/formations/${result.id}?success=${encodeURIComponent("Formation créée.")}`);
}

export async function updateTrainingAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  const result = await updateTraining(id, {
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    category: field(formData, "category") || undefined,
    duration_hours: Number(field(formData, "duration_hours")) || 0,
    price_gnf: Number(field(formData, "price_gnf")) || 0,
    max_participants: Number(field(formData, "max_participants")) || 20,
    instructor_name: field(formData, "instructor_name") || undefined,
    location: field(formData, "location") || undefined,
    status: (field(formData, "status") || "draft") as TrainingStatus,
  });

  if (!result.success) {
    redirect(`/formation/formations/${id}?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateFormation();
  redirect(`/formation/formations/${id}?success=${encodeURIComponent("Formation mise à jour.")}`);
}

export async function deleteTrainingAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canFormationDelete(user.id))) redirect("/access-denied");

  const training = await getTrainingById(id);
  const label = training?.title ?? id;
  const [profile, roleKey] = await Promise.all([getCachedProfileRow(user.id), getUserRole(user.id)]);

  const result = await createApprovalRequest({
    requestedBy: user.id,
    requesterName: profile.displayName || "Responsable",
    requesterRole: roleKey || profile.roleKey || "",
    requesterDept: "Formation",
    actionType: SENSITIVE_ACTIONS.CANCEL_FORMATION.type,
    module: SENSITIVE_ACTIONS.CANCEL_FORMATION.module,
    targetId: id,
    targetLabel: label,
    description: SENSITIVE_ACTIONS.CANCEL_FORMATION.description(label),
    actionPayload: { id, table: "trainings", operation: "soft_delete" },
    priority: SENSITIVE_ACTIONS.CANCEL_FORMATION.priority,
  });

  if (!result.success) {
    redirect(`/formation/formations/${id}?error=${encodeURIComponent("Erreur lors de la demande")}`);
  }
  redirect(
    `/formation/formations?success=${encodeURIComponent("Demande envoyée. En attente d'approbation du Super Admin.")}`,
  );
}

/** Direct soft delete for super-admin emergency (not exposed in UI). */
export async function softDeleteTrainingDirectAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);
  await softDeleteTraining(id);
  await revalidateFormation();
  redirect(`/formation/formations?success=${encodeURIComponent("Formation supprimée.")}`);
}
