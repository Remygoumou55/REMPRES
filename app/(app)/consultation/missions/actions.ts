"use server";

import { redirect } from "next/navigation";
import { revalidateConsultation } from "@/lib/cache/revalidation-map";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getUserRole } from "@/lib/server/permissions";
import { assertConsultationWrite, canConsultationDelete } from "@/lib/server/consultation-access";
import {
  createDeliverable,
  createMission,
  createMissionPhase,
  getMissionById,
  updateMission,
} from "@/lib/server/consultation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import type { MissionStatus } from "@/lib/types/consultation";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createMissionAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  const result = await createMission({
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    client_name: field(formData, "client_name") || undefined,
    start_date: field(formData, "start_date") || undefined,
    end_date: field(formData, "end_date") || undefined,
    budget_gnf: Number(field(formData, "budget_gnf")) || 0,
    lead_consultant: field(formData, "lead_consultant") || undefined,
    status: (field(formData, "status") || "draft") as MissionStatus,
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(`/consultation/missions/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateConsultation();
  redirect(`/consultation/missions/${result.id}?success=${encodeURIComponent("Mission créée.")}`);
}

export async function updateMissionAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  const result = await updateMission(id, {
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    client_name: field(formData, "client_name") || undefined,
    start_date: field(formData, "start_date") || undefined,
    end_date: field(formData, "end_date") || undefined,
    budget_gnf: Number(field(formData, "budget_gnf")) || 0,
    lead_consultant: field(formData, "lead_consultant") || undefined,
    status: (field(formData, "status") || "draft") as MissionStatus,
    notes: field(formData, "notes") || undefined,
  });

  if (!result.success) {
    redirect(`/consultation/missions/${id}?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateConsultation();
  redirect(`/consultation/missions/${id}?success=${encodeURIComponent("Mission mise à jour.")}`);
}

export async function deleteMissionAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canConsultationDelete(user.id))) redirect("/access-denied");

  const mission = await getMissionById(id);
  const label = mission ? `${mission.reference} — ${mission.title}` : id;
  const [profile, roleKey] = await Promise.all([getCachedProfileRow(user.id), getUserRole(user.id)]);

  const result = await createApprovalRequest({
    requestedBy: user.id,
    requesterName: profile.displayName || "Responsable",
    requesterRole: roleKey || profile.roleKey || "",
    requesterDept: "Consultation",
    actionType: SENSITIVE_ACTIONS.DELETE_MISSION.type,
    module: SENSITIVE_ACTIONS.DELETE_MISSION.module,
    targetId: id,
    targetLabel: label,
    description: SENSITIVE_ACTIONS.DELETE_MISSION.description(label),
    actionPayload: { id, table: "missions", operation: "soft_delete" },
    priority: SENSITIVE_ACTIONS.DELETE_MISSION.priority,
  });

  if (!result.success) {
    redirect(`/consultation/missions/${id}?error=${encodeURIComponent("Erreur lors de la demande")}`);
  }
  redirect(
    `/consultation/missions?success=${encodeURIComponent("Demande envoyée. En attente d'approbation du Super Admin.")}`,
  );
}

export async function addDeliverableAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);
  const missionId = field(formData, "mission_id");
  await createDeliverable({
    mission_id: missionId,
    title: field(formData, "title"),
    due_date: field(formData, "due_date") || undefined,
  });
  await revalidateConsultation();
  redirect(`/consultation/missions/${missionId}?success=${encodeURIComponent("Livrable ajouté.")}`);
}

export async function addPhaseAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);
  const missionId = field(formData, "mission_id");
  await createMissionPhase({
    mission_id: missionId,
    title: field(formData, "title"),
  });
  await revalidateConsultation();
  redirect(`/consultation/missions/${missionId}?success=${encodeURIComponent("Phase ajoutée.")}`);
}
