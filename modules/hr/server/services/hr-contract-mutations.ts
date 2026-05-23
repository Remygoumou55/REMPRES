/**
 * P7.1 — Mutation création contrat gouvernée : gate → write → publisher → audit.
 */

import type { Json } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import { emitHrContractCreated } from "@/lib/erp-core/events/integrations/hr-events";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";
import { isValidContractType } from "@/modules/hr/contracts/server/validators/contract";

export type CreateHrContractInput = {
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate: string | null;
  salaryGnf: number | null;
  title: string | null;
};

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

export async function createHrContract(
  userId: string,
  input: CreateHrContractInput,
): Promise<{ success: true; contractId: string } | { success: false; error: string }> {
  const contractType = String(input.contractType ?? "").trim().toLowerCase();
  if (!isValidContractType(contractType)) {
    return { success: false, error: "Type de contrat invalide." };
  }

  const employeeId = String(input.employeeId ?? "").trim();
  if (!employeeId) return { success: false, error: "Collaborateur requis." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.CONTRACT_CREATE, "create");
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const profile = await supabase
    .from("profiles")
    .select("id,is_active,deleted_at")
    .eq("id", employeeId)
    .maybeSingle();
  if (profile.error || !profile.data || profile.data.deleted_at || !profile.data.is_active) {
    return { success: false, error: "Collaborateur introuvable ou inactif." };
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
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (insert.error || !insert.data) return { success: false, error: "Creation contrat impossible." };

  const contractId = insert.data.id;

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "created",
    event_label: "Contrat cree",
    payload: {},
    created_by: userId,
  });

  await Promise.all([
    emitHrContractCreated({
      actorUserId: userId,
      contractId,
      employeeId,
      contractType,
      status: "draft",
      startDate: input.startDate,
      endDate: input.endDate,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.CONTRACT_CREATE,
      entityType: "rh_contract",
      entityId: contractId,
      afterSnapshot: {
        contract_id: contractId,
        employee_id: employeeId,
        contract_type: contractType,
        status: "draft",
        start_date: input.startDate,
        end_date: input.endDate,
      },
    }),
    logRhContractActivity({
      actorId: userId,
      actionKey: "contract_created",
      contractId,
      metadata: { employee_id: employeeId, contract_type: contractType },
    }),
  ]);

  return { success: true, contractId };
}
