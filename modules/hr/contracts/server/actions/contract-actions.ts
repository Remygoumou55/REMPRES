"use server";

import type { Json } from "@/types/database.types";
import { createApprovalRequest } from "@/lib/governance/approvals/repository";
import { tryCreateAlert } from "@/lib/governance/alerts/create-alert";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { revalidateRhScope } from "@/lib/server/revalidate-domains";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertCanManageContracts } from "@/modules/hr/contracts/server/security/access";
import { isValidContractStatus, isValidContractType } from "@/modules/hr/contracts/server/validators/contract";

const RH_CONTRACT_ENTITY = "rh_contract";
const APPROVAL_ACTION = "rh_contract_activation";

async function logRhContractActivity(input: {
  actorId: string;
  actionKey: string;
  contractId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();
  await supabase.from("activity_logs").insert({
    actor_user_id: input.actorId,
    module_key: "rh",
    action_key: input.actionKey,
    target_table: "rh_employee_contracts",
    target_id: input.contractId,
    metadata: (input.metadata ?? {}) as Json,
  });
}

export async function createContractAction(input: {
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate: string | null;
  salaryGnf: number | null;
  title: string | null;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }
  const contractType = String(input.contractType ?? "").trim().toLowerCase();
  if (!isValidContractType(contractType)) return { success: false as const, error: "Type de contrat invalide." };

  const employeeId = String(input.employeeId ?? "").trim();
  if (!employeeId) return { success: false as const, error: "Collaborateur requis." };

  const supabase = getSupabaseServerClient();
  const profile = await supabase
    .from("profiles")
    .select("id,is_active,deleted_at")
    .eq("id", employeeId)
    .maybeSingle();
  if (profile.error || !profile.data || profile.data.deleted_at || !profile.data.is_active) {
    return { success: false as const, error: "Collaborateur introuvable ou inactif." };
  }

  const insert = await supabase
    .from("rh_employee_contracts")
    .insert({
      employee_id: employeeId,
      contract_type: contractType,
      status: "draft",
      start_date: input.startDate,
      end_date: input.endDate,
      salary_gnf: input.salaryGnf,
      title: input.title,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select("id")
    .single();
  if (insert.error || !insert.data) return { success: false as const, error: "Creation contrat impossible." };

  const contractId = insert.data.id;

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "created",
    event_label: "Contrat cree",
    payload: {},
    created_by: actor.id,
  });

  await logRhContractActivity({
    actorId: actor.id,
    actionKey: "contract_created",
    contractId,
    metadata: { employee_id: employeeId, contract_type: contractType },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, contractId };
}

export async function submitContractForApprovalAction(input: { contractId: string; reason?: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const contractId = String(input.contractId ?? "").trim();
  if (!contractId) return { success: false as const, error: "Contrat invalide." };

  const supabase = getSupabaseServerClient();
  const existing = await supabase
    .from("rh_employee_contracts")
    .select("id,status,employee_id,contract_type,start_date,end_date,approval_request_id")
    .eq("id", contractId)
    .maybeSingle();
  if (existing.error || !existing.data) return { success: false as const, error: "Contrat introuvable." };
  if (existing.data.status !== "draft") {
    return { success: false as const, error: "Seuls les contrats en brouillon peuvent etre soumis." };
  }

  const pendingDup = await supabase
    .from("approval_requests")
    .select("id")
    .eq("entity_type", RH_CONTRACT_ENTITY)
    .eq("entity_id", contractId)
    .eq("status", "pending")
    .maybeSingle();
  if (pendingDup.data?.id) {
    return { success: false as const, error: "Une demande d'approbation est deja en cours pour ce contrat." };
  }

  let approvalId: string;
  try {
    const approval = await createApprovalRequest({
      departmentKey: "rh",
      actionType: APPROVAL_ACTION,
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      requestedBy: actor.id,
      reason: String(input.reason ?? "").trim() || null,
      payloadSnapshot: {
        contract_id: contractId,
        employee_id: existing.data.employee_id,
        contract_type: existing.data.contract_type,
        start_date: existing.data.start_date,
        end_date: existing.data.end_date,
      },
    });
    approvalId = approval.id;
  } catch {
    return { success: false as const, error: "Impossible de creer la demande d'approbation." };
  }

  const updated = await supabase
    .from("rh_employee_contracts")
    .update({ status: "pending_approval", approval_request_id: approvalId, updated_by: actor.id })
    .eq("id", contractId)
    .eq("status", "draft");
  if (updated.error) {
    await supabase.from("approval_requests").delete().eq("id", approvalId);
    return { success: false as const, error: "Mise a jour du contrat impossible." };
  }

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "submitted_for_approval",
    event_label: "Contrat soumis pour approbation gouvernance",
    payload: { approval_request_id: approvalId },
    created_by: actor.id,
  });

  await logRhContractActivity({
    actorId: actor.id,
    actionKey: "contract_submitted_for_approval",
    contractId,
    metadata: { approval_request_id: approvalId },
  });

  await tryCreateAlert({
    type: "rh_contract_pending_approval",
    severity: "medium",
    departmentKey: "rh",
    title: "Contrat RH en attente d'approbation",
    description: "Un contrat collaborateur necessite une validation super-admin.",
    entityType: RH_CONTRACT_ENTITY,
    entityId: contractId,
    triggeredBy: actor.id,
    metadata: { approval_request_id: approvalId },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, approvalRequestId: approvalId };
}

export async function transitionContractStatusAction(input: {
  contractId: string;
  status: string;
  reason?: string;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const nextStatus = String(input.status ?? "").trim().toLowerCase();
  if (!isValidContractStatus(nextStatus)) return { success: false as const, error: "Statut invalide." };

  const supabase = getSupabaseServerClient();
  const row = await supabase.from("rh_employee_contracts").select("status").eq("id", input.contractId).maybeSingle();
  if (row.error || !row.data) return { success: false as const, error: "Contrat introuvable." };

  if (nextStatus === "active") {
    const s = row.data.status;
    if (s === "draft" || s === "pending_approval") {
      return {
        success: false as const,
        error: "Activation reservee apres approbation gouvernance.",
      };
    }
  }

  const update = await supabase
    .from("rh_employee_contracts")
    .update({ status: nextStatus, updated_by: actor.id })
    .eq("id", input.contractId);
  if (update.error) return { success: false as const, error: "Transition statut impossible." };

  await supabase.from("rh_contract_history").insert({
    contract_id: input.contractId,
    event_type: "status_changed",
    event_label: `Statut contrat : ${nextStatus}`,
    payload: { reason: input.reason ?? null },
    created_by: actor.id,
  });

  await logRhContractActivity({
    actorId: actor.id,
    actionKey: `contract_status_${nextStatus}`,
    contractId: input.contractId,
    metadata: { status: nextStatus },
  });

  if (nextStatus === "renewal_due") {
    await tryCreateAlert({
      type: "rh_contract_renewal_due",
      severity: "medium",
      departmentKey: "rh",
      title: "Renouvellement contrat a planifier",
      description: "Un contrat a ete marque en renouvellement.",
      entityType: RH_CONTRACT_ENTITY,
      entityId: input.contractId,
      triggeredBy: actor.id,
      metadata: {},
    });
  }
  if (nextStatus === "expired" || nextStatus === "terminated") {
    await tryCreateAlert({
      type: nextStatus === "expired" ? "rh_contract_expired" : "rh_contract_terminated",
      severity: nextStatus === "terminated" ? "high" : "medium",
      departmentKey: "rh",
      title: nextStatus === "terminated" ? "Contrat termine" : "Contrat expire",
      description: "Mise a jour manuelle du cycle de vie contrat.",
      entityType: RH_CONTRACT_ENTITY,
      entityId: input.contractId,
      triggeredBy: actor.id,
      metadata: {},
    });
  }

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function renewContractAction(input: { contractId: string; newEndDate: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const contractId = String(input.contractId ?? "").trim();
  const newEndDate = String(input.newEndDate ?? "").trim();
  if (!contractId || !newEndDate) return { success: false as const, error: "Dates invalides." };

  const supabase = getSupabaseServerClient();
  const existing = await supabase
    .from("rh_employee_contracts")
    .select("id,start_date,end_date,status")
    .eq("id", contractId)
    .maybeSingle();
  if (existing.error || !existing.data) return { success: false as const, error: "Contrat introuvable." };

  if (existing.data.start_date > newEndDate) {
    return { success: false as const, error: "La nouvelle date de fin doit etre apres la date de debut." };
  }

  const updated = await supabase
    .from("rh_employee_contracts")
    .update({ end_date: newEndDate, status: "active", updated_by: actor.id })
    .eq("id", contractId);
  if (updated.error) return { success: false as const, error: "Renouvellement impossible." };

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "renewed",
    event_label: "Contrat renouvele (nouvelle date de fin)",
    payload: { previous_end_date: existing.data.end_date, new_end_date: newEndDate },
    created_by: actor.id,
  });

  await logRhContractActivity({
    actorId: actor.id,
    actionKey: "contract_renewed",
    contractId,
    metadata: { new_end_date: newEndDate },
  });

  await tryCreateAlert({
    type: "rh_contract_renewed",
    severity: "low",
    departmentKey: "rh",
    title: "Contrat renouvele",
    description: "La date de fin du contrat a ete mise a jour.",
    entityType: RH_CONTRACT_ENTITY,
    entityId: contractId,
    triggeredBy: actor.id,
    metadata: { new_end_date: newEndDate },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function addContractDocumentAction(input: {
  contractId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
}) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const insert = await supabase.from("rh_contract_documents").insert({
    contract_id: input.contractId,
    uploaded_by: actor.id,
    document_type: input.documentType,
    file_name: input.fileName,
    storage_path: input.storagePath,
  });
  if (insert.error) return { success: false as const, error: "Ajout document impossible." };

  await supabase.from("rh_contract_history").insert({
    contract_id: input.contractId,
    event_type: "document_uploaded",
    event_label: "Document contrat depose",
    payload: { document_type: input.documentType, file_name: input.fileName },
    created_by: actor.id,
  });

  await logRhContractActivity({
    actorId: actor.id,
    actionKey: "contract_document_uploaded",
    contractId: input.contractId,
    metadata: { document_type: input.documentType, file_name: input.fileName },
  });

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}
