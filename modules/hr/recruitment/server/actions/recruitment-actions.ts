"use server";

import type { Database, Json } from "@/types/database.types";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { revalidateRhScope } from "@/lib/server/revalidate-domains";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertCanManageRecruitment } from "@/modules/hr/recruitment/server/security/access";
import { getCandidateById } from "@/modules/hr/recruitment/server/repositories/candidates-repository";
import { upsertOnboardingPatch } from "@/modules/hr/recruitment/server/repositories/onboarding-repository";
import {
  linkHrCandidateToEmployeeDomain,
  submitHrRecruitmentHire,
} from "@/modules/hr/server/services/hr-recruitment-mutations";
import { isAllowedPipelineAdvance, isFrozenPipelineStage } from "@/modules/hr/recruitment/utils";
import {
  isValidInterviewStatus,
  isValidInterviewType,
  isValidOnboardingStatus,
  isValidPipelineStage,
  isValidRecommendation,
  isValidSourceChannel,
} from "@/modules/hr/recruitment/server/validators/recruitment";

async function logRhRecruitment(input: {
  actorId: string;
  actionKey: string;
  candidateId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();
  await supabase.from("activity_logs").insert({
    actor_user_id: input.actorId,
    module_key: "rh",
    action_key: input.actionKey,
    target_table: "rh_recruitment_candidates",
    target_id: input.candidateId,
    metadata: (input.metadata ?? {}) as Json,
  });
}

async function insertHistory(input: {
  candidateId: string;
  eventType: string;
  eventLabel: string;
  payload?: Record<string, unknown>;
  createdBy: string;
}) {
  const supabase = getSupabaseServerClient();
  await supabase.from("rh_recruitment_history").insert({
    candidate_id: input.candidateId,
    event_type: input.eventType,
    event_label: input.eventLabel,
    payload: (input.payload ?? {}) as Json,
    created_by: input.createdBy,
  });
}

export async function createCandidateAction(input: {
  fullName: string;
  email: string;
  phone?: string | null;
  jobTitle: string;
  departmentKey?: string | null;
  sourceChannel?: string;
  notes?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const channel = String(input.sourceChannel ?? "direct").toLowerCase();
  if (!isValidSourceChannel(channel)) return { success: false as const, error: "Canal source invalide." };

  const supabase = getSupabaseServerClient();
  const insert = await supabase
    .from("rh_recruitment_candidates")
    .insert({
      full_name: String(input.fullName ?? "").trim(),
      email: String(input.email ?? "").trim().toLowerCase(),
      phone: input.phone ? String(input.phone).trim() : null,
      job_title: String(input.jobTitle ?? "").trim(),
      department_key: input.departmentKey ? String(input.departmentKey).trim() : null,
      source_channel: channel,
      notes: input.notes ? String(input.notes).trim() : null,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) return { success: false as const, error: "Creation candidat impossible." };
  const candidateId = insert.data.id;

  await insertHistory({
    candidateId,
    eventType: "candidate_created",
    eventLabel: "Candidat cree",
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_candidate_created",
    candidateId,
    metadata: { email: input.email },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, candidateId };
}

export async function advanceCandidatePipelineAction(input: { candidateId: string; nextStage: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const next = String(input.nextStage ?? "").trim().toLowerCase();
  if (!isValidPipelineStage(next)) return { success: false as const, error: "Etape invalide." };

  const current = await getCandidateById(input.candidateId);
  if (!current) return { success: false as const, error: "Candidat introuvable." };

  if (isFrozenPipelineStage(current.pipelineStage)) {
    return { success: false as const, error: "Pipeline fige pour ce candidat." };
  }

  if (!isAllowedPipelineAdvance(current.pipelineStage, next)) {
    return { success: false as const, error: "Transition pipeline non autorisee." };
  }

  const supabase = getSupabaseServerClient();
  const upd = await supabase
    .from("rh_recruitment_candidates")
    .update({ pipeline_stage: next, updated_by: actor.id })
    .eq("id", input.candidateId);
  if (upd.error) return { success: false as const, error: "Mise a jour impossible." };

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "pipeline_advanced",
    eventLabel: `Etape : ${next}`,
    payload: { from: current.pipelineStage, to: next },
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_pipeline_advanced",
    candidateId: input.candidateId,
    metadata: { from: current.pipelineStage, to: next },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function submitHireForApprovalAction(input: { candidateId: string; reason?: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const result = await submitHrRecruitmentHire(actor.id, input);
  if (!result.success) return { success: false as const, error: result.error };

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, approvalRequestId: result.approvalRequestId };
}

export async function scheduleInterviewAction(input: {
  candidateId: string;
  interviewType: string;
  scheduledAt: string;
  durationMinutes?: number;
  locationNote?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const it = String(input.interviewType ?? "hr").toLowerCase();
  if (!isValidInterviewType(it)) return { success: false as const, error: "Type d'entretien invalide." };

  const supabase = getSupabaseServerClient();
  const ins = await supabase.from("rh_recruitment_interviews").insert({
    candidate_id: input.candidateId,
    interview_type: it,
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes ?? 60,
    location_note: input.locationNote ? String(input.locationNote).trim() : null,
    status: "scheduled",
    created_by: actor.id,
  });
  if (ins.error) return { success: false as const, error: "Planification impossible." };

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "interview_scheduled",
    eventLabel: "Entretien planifie",
    payload: { interview_type: it, scheduled_at: input.scheduledAt },
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_interview_scheduled",
    candidateId: input.candidateId,
    metadata: { scheduled_at: input.scheduledAt },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function updateInterviewStatusAction(input: {
  interviewId: string;
  candidateId: string;
  status: string;
  notes?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const st = String(input.status ?? "").toLowerCase();
  if (!isValidInterviewStatus(st)) return { success: false as const, error: "Statut entretien invalide." };

  const supabase = getSupabaseServerClient();
  const patch: Database["public"]["Tables"]["rh_recruitment_interviews"]["Update"] = { status: st };
  if (input.notes !== undefined) {
    patch.notes = String(input.notes ?? "").trim() || null;
  }
  const upd = await supabase
    .from("rh_recruitment_interviews")
    .update(patch)
    .eq("id", input.interviewId)
    .eq("candidate_id", input.candidateId);
  if (upd.error) return { success: false as const, error: "Mise a jour entretien impossible." };

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "interview_status",
    eventLabel: `Entretien : ${st}`,
    payload: { interview_id: input.interviewId },
    createdBy: actor.id,
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function addEvaluationAction(input: {
  candidateId: string;
  score?: number | null;
  recommendation: string;
  comments?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const rec = String(input.recommendation ?? "").toLowerCase();
  if (!isValidRecommendation(rec)) return { success: false as const, error: "Avis invalide." };

  const score =
    input.score === null || input.score === undefined ? null : Math.round(Number(input.score));
  if (score !== null && (score < 1 || score > 5)) {
    return { success: false as const, error: "Score entre 1 et 5." };
  }

  const supabase = getSupabaseServerClient();
  const ins = await supabase.from("rh_recruitment_evaluations").insert({
    candidate_id: input.candidateId,
    evaluator_user_id: actor.id,
    score,
    recommendation: rec,
    comments: input.comments ? String(input.comments).trim() : null,
  });
  if (ins.error) return { success: false as const, error: "Enregistrement evaluation impossible." };

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "evaluation_recorded",
    eventLabel: `Evaluation : ${rec}`,
    payload: { score },
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_evaluation_recorded",
    candidateId: input.candidateId,
    metadata: { recommendation: rec, score },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function addCandidateDocumentAction(input: {
  candidateId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const ins = await supabase.from("rh_recruitment_documents").insert({
    candidate_id: input.candidateId,
    uploaded_by: actor.id,
    document_type: String(input.documentType ?? "").trim(),
    file_name: String(input.fileName ?? "").trim(),
    storage_path: String(input.storagePath ?? "").trim(),
  });
  if (ins.error) return { success: false as const, error: "Ajout document impossible." };

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "document_uploaded",
    eventLabel: "Document candidat depose",
    payload: { document_type: input.documentType, file_name: input.fileName },
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_document_uploaded",
    candidateId: input.candidateId,
    metadata: { document_type: input.documentType },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function updateOnboardingAction(input: {
  candidateId: string;
  status?: string;
  checklist?: Record<string, unknown>;
  linkedProfileId?: string | null;
  linkedContractId?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  let status: "not_started" | "in_progress" | "completed" | undefined;
  if (input.status !== undefined) {
    const s = String(input.status).toLowerCase();
    if (!isValidOnboardingStatus(s)) return { success: false as const, error: "Statut onboarding invalide." };
    status = s;
  }

  await upsertOnboardingPatch(input.candidateId, {
    status,
    checklist: input.checklist,
    linked_profile_id: input.linkedProfileId,
    linked_contract_id: input.linkedContractId,
  });

  await insertHistory({
    candidateId: input.candidateId,
    eventType: "onboarding_updated",
    eventLabel: "Onboarding mis a jour",
    payload: { status: status ?? null },
    createdBy: actor.id,
  });
  await logRhRecruitment({
    actorId: actor.id,
    actionKey: "recruitment_onboarding_updated",
    candidateId: input.candidateId,
    metadata: {},
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

/** Rattache un candidat embauché au domaine employés / contrats (profil ERP + contrat RH). */
export async function linkCandidateToEmployeeDomainAction(input: {
  candidateId: string;
  profileId: string;
  contractId?: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Non authentifie." };
  if (!(await assertCanManageRecruitment(actor.id))) {
    return { success: false as const, error: "Reserve aux gestionnaires RH." };
  }

  const result = await linkHrCandidateToEmployeeDomain(actor.id, input);
  if (!result.success) return { success: false as const, error: result.error };

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}
