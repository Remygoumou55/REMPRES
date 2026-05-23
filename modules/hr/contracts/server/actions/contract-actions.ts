"use server";

import type { Json } from "@/types/database.types";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { revalidateRhScope } from "@/lib/server/revalidate-domains";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertCanManageContracts } from "@/modules/hr/contracts/server/security/access";
import { createHrContract } from "@/modules/hr/server/services/hr-contract-mutations";
import {
  renewHrContract,
  submitHrContractForApproval,
  transitionHrContractStatus,
} from "@/modules/hr/server/services/hr-contract-lifecycle-mutations";

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

  const result = await createHrContract(actor.id, input);
  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, contractId: result.contractId };
}

export async function submitContractForApprovalAction(input: { contractId: string; reason?: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const result = await submitHrContractForApproval(actor.id, input);
  if (!result.success) return { success: false as const, error: result.error };

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const, approvalRequestId: result.approvalRequestId };
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

  const result = await transitionHrContractStatus(actor.id, input);
  if (!result.success) return { success: false as const, error: result.error };

  revalidateRhScope({ includeDashboard: true });
  return { success: true as const };
}

export async function renewContractAction(input: { contractId: string; newEndDate: string }) {
  const actor = await getServerSessionUser();
  if (!actor) return { success: false as const, error: "Utilisateur non authentifie." };
  if (!(await assertCanManageContracts(actor.id))) {
    return { success: false as const, error: "Action reservee aux gestionnaires RH." };
  }

  const result = await renewHrContract(actor.id, input);
  if (!result.success) return { success: false as const, error: result.error };

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
