/**
 * P9 — Mutations recrutement gouvernées : gate → write → publisher → audit.
 */

import type { Json } from "@/types/database.types";
import { createApprovalRequest } from "@/lib/governance/approvals/repository";
import {
  emitHrEmployeeCreated,
  emitHrRecruitmentHireSubmitted,
} from "@/lib/erp-core/events/integrations/hr-events";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  RECRUITMENT_HIRE_APPROVAL_ACTION,
  RECRUITMENT_HIRE_ENTITY,
} from "@/modules/hr/recruitment/constants";
import { getCandidateById } from "@/modules/hr/recruitment/server/repositories/candidates-repository";
import { upsertOnboardingPatch } from "@/modules/hr/recruitment/server/repositories/onboarding-repository";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";

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

export async function submitHrRecruitmentHire(
  userId: string,
  input: { candidateId: string; reason?: string },
): Promise<
  { success: true; approvalRequestId: string } | { success: false; error: string }
> {
  const candidateId = String(input.candidateId ?? "").trim();
  if (!candidateId) return { success: false, error: "Candidat invalide." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.RECRUITMENT_HIRE_SUBMIT, "update", {
      entityType: RECRUITMENT_HIRE_ENTITY,
      entityId: candidateId,
      reason: input.reason,
    });
  } catch {
    return { success: false, error: "Reserve aux gestionnaires RH." };
  }

  const candidate = await getCandidateById(candidateId);
  if (!candidate) return { success: false, error: "Candidat introuvable." };
  if (candidate.pipelineStage !== "offer") {
    return { success: false, error: "Soumission embauche depuis l'etape offre uniquement." };
  }

  const supabase = getSupabaseServerClient();
  const pendingDup = await supabase
    .from("approval_requests")
    .select("id")
    .eq("entity_type", RECRUITMENT_HIRE_ENTITY)
    .eq("entity_id", candidateId)
    .eq("status", "pending")
    .maybeSingle();
  if (pendingDup.data?.id) {
    return { success: false, error: "Demande d'embauche deja en cours." };
  }

  let approvalId: string;
  try {
    const approval = await createApprovalRequest({
      departmentKey: "rh",
      actionType: RECRUITMENT_HIRE_APPROVAL_ACTION,
      entityType: RECRUITMENT_HIRE_ENTITY,
      entityId: candidateId,
      requestedBy: userId,
      reason: String(input.reason ?? "").trim() || null,
      payloadSnapshot: {
        candidate_id: candidateId,
        full_name: candidate.fullName,
        job_title: candidate.jobTitle,
        email: candidate.email,
      },
    });
    approvalId = approval.id;
  } catch {
    return { success: false, error: "Creation demande d'approbation impossible." };
  }

  const upd = await supabase
    .from("rh_recruitment_candidates")
    .update({
      pipeline_stage: "pending_hire_approval",
      hire_approval_request_id: approvalId,
      updated_by: userId,
    })
    .eq("id", candidateId)
    .eq("pipeline_stage", "offer");

  if (upd.error) {
    await supabase.from("approval_requests").delete().eq("id", approvalId);
    return { success: false, error: "Mise a jour candidat impossible." };
  }

  await insertHistory({
    candidateId,
    eventType: "hire_submitted",
    eventLabel: "Embauche soumise pour validation gouvernance",
    payload: { approval_request_id: approvalId },
    createdBy: userId,
  });

  await Promise.all([
    emitHrRecruitmentHireSubmitted({
      actorUserId: userId,
      candidateId,
      approvalRequestId: approvalId,
      candidateName: candidate.fullName,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.RECRUITMENT_HIRE_SUBMIT,
      entityType: RECRUITMENT_HIRE_ENTITY,
      entityId: candidateId,
      afterSnapshot: {
        pipeline_stage: "pending_hire_approval",
        approval_request_id: approvalId,
      },
    }),
    logRhRecruitment({
      actorId: userId,
      actionKey: "recruitment_hire_submitted",
      candidateId,
      metadata: { approval_request_id: approvalId },
    }),
  ]);

  return { success: true, approvalRequestId: approvalId };
}

export async function linkHrCandidateToEmployeeDomain(
  userId: string,
  input: { candidateId: string; profileId: string; contractId?: string | null },
): Promise<{ success: true } | { success: false; error: string }> {
  const candidateId = String(input.candidateId ?? "").trim();
  const profileId = String(input.profileId ?? "").trim();
  if (!candidateId || !profileId) return { success: false, error: "Profil requis." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.RECRUITMENT_DOMAIN_LINK, "update", {
      entityType: RECRUITMENT_HIRE_ENTITY,
      entityId: candidateId,
    });
  } catch {
    return { success: false, error: "Reserve aux gestionnaires RH." };
  }

  const candidate = await getCandidateById(candidateId);
  if (!candidate) return { success: false, error: "Candidat introuvable." };
  if (candidate.pipelineStage !== "hired") {
    return { success: false, error: "Lien reserve aux candidats embauches." };
  }

  const supabase = getSupabaseServerClient();
  const profile = await supabase
    .from("profiles")
    .select("id,is_active,deleted_at,role_key")
    .eq("id", profileId)
    .maybeSingle();
  if (profile.error || !profile.data || profile.data.deleted_at || !profile.data.is_active) {
    return { success: false, error: "Profil invalide ou inactif." };
  }

  let contractId: string | null = input.contractId ? String(input.contractId).trim() : null;
  if (contractId) {
    const ctr = await supabase
      .from("rh_employee_contracts")
      .select("id,employee_id")
      .eq("id", contractId)
      .maybeSingle();
    if (ctr.error || !ctr.data) return { success: false, error: "Contrat introuvable." };
    if (ctr.data.employee_id !== profileId) {
      return { success: false, error: "Le contrat ne correspond pas au collaborateur." };
    }
  }

  const wasAlreadyLinked = Boolean(candidate.hiredProfileId);

  const upd = await supabase
    .from("rh_recruitment_candidates")
    .update({
      hired_profile_id: profileId,
      hired_contract_id: contractId,
      updated_by: userId,
    })
    .eq("id", candidateId);
  if (upd.error) return { success: false, error: "Mise a jour candidat impossible." };

  await upsertOnboardingPatch(candidateId, {
    status: "in_progress",
    linked_profile_id: profileId,
    linked_contract_id: contractId,
  });

  await insertHistory({
    candidateId,
    eventType: "domain_linked",
    eventLabel: "Rattachement employe / contrat",
    payload: { profile_id: profileId, contract_id: contractId },
    createdBy: userId,
  });

  const tasks: Promise<unknown>[] = [
    logRhRecruitment({
      actorId: userId,
      actionKey: "recruitment_domain_linked",
      candidateId,
      metadata: { profile_id: profileId, contract_id: contractId },
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.RECRUITMENT_DOMAIN_LINK,
      entityType: RECRUITMENT_HIRE_ENTITY,
      entityId: candidateId,
      afterSnapshot: { profile_id: profileId, contract_id: contractId },
    }),
  ];

  if (!wasAlreadyLinked) {
    tasks.push(
      emitHrEmployeeCreated({
        actorUserId: userId,
        employeeId: profileId,
        role: profile.data.role_key,
        status: profile.data.is_active ? "active" : "inactive",
      }),
    );
  }

  await Promise.all(tasks);
  return { success: true };
}
