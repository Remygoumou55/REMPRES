/**
 * B2.1 — Mutations CRM gouvernées (B2.0 write gate + B1.5 transitions).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createClient } from "@/lib/server/clients";
import {
  assertLeadStatusTransition,
  assertQuoteStatusTransition,
  isTerminalPipelineStage,
  type CrmLeadStatus,
  type CrmQuoteStatus,
} from "@/lib/vente/runtime/crm-state-machine";
import { CRM_WRITE_ACTIONS } from "@/lib/vente/runtime/crm-write-governance";
import { assertCrmWriteActionAllowed } from "@/lib/vente/runtime/crm-write-governance";
import {
  emitCrmActivityCompleted,
  emitCrmActivityCreated,
  emitCrmDealCreated,
  emitCrmDealLost,
  emitCrmDealWon,
  emitCrmLeadConverted,
  emitCrmLeadCreated,
  emitCrmLeadUpdated,
  emitCrmPipelineUpdated,
  emitCrmQuoteCreated,
  emitCrmQuoteStatusUpdated,
} from "@/lib/erp-core/events/integrations/crm-events";
import { recordCrmGovernanceAudit } from "@/modules/crm/server/services/crm-audit-hook";

type Db = SupabaseClient<Database>;

async function loadLead(supabase: Db, leadId: string) {
  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead introuvable.");
  return data;
}

async function loadOpportunity(supabase: Db, opportunityId: string) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select("*, crm_pipeline_stages(is_terminal_win,is_terminal_loss,code)")
    .eq("id", opportunityId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Opportunité introuvable.");
  return data;
}

async function loadQuote(supabase: Db, quoteId: string) {
  const { data, error } = await supabase
    .from("crm_quotes")
    .select("*")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Devis introuvable.");
  return data;
}

export type CreateCrmLeadInput = {
  companyName?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  estimatedValueGnf?: number;
};

export async function createCrmLead(userId: string, input: CreateCrmLeadInput) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.LEAD_CREATE, "create");

  const supabase = getSupabaseServerClient();
  const company = (input.companyName ?? "").trim();
  const first = (input.contactFirstName ?? "").trim();
  const last = (input.contactLastName ?? "").trim();

  if (!company && !first) {
    throw new Error("Renseignez au minimum un nom de société ou un prénom de contact.");
  }

  const { data, error } = await supabase
    .from("crm_leads")
    .insert({
      status: "new",
      company_name: company || null,
      contact_first_name: first || null,
      contact_last_name: last || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      source: input.source?.trim() || null,
      estimated_value_gnf: Math.max(0, Number(input.estimatedValueGnf ?? 0)),
      owner_id: userId,
      created_by: userId,
    })
    .select("id,status,company_name,created_at")
    .single();

  if (error) throw new Error(error.message);

  const eventPromise = emitCrmLeadCreated({
    actorUserId: userId,
    leadId: data.id,
    status: data.status,
    companyName: data.company_name,
    estimatedValueGnf: Math.max(0, Number(input.estimatedValueGnf ?? 0)),
  });

  await Promise.all([
    eventPromise,
    recordCrmGovernanceAudit({
    actionType: CRM_WRITE_ACTIONS.LEAD_CREATE,
    entityType: "crm_leads",
    entityId: data.id,
    afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateCrmLeadStatus(
  userId: string,
  leadId: string,
  nextStatus: CrmLeadStatus,
  lostReason?: string | null,
) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.LEAD_UPDATE_STATUS, "update");

  const supabase = getSupabaseServerClient();
  const lead = await loadLead(supabase, leadId);
  const from = lead.status as CrmLeadStatus;
  assertLeadStatusTransition(from, nextStatus);

  const { data, error } = await supabase
    .from("crm_leads")
    .update({
      status: nextStatus,
      lost_reason: nextStatus === "lost" ? (lostReason?.trim() || null) : lead.lost_reason,
    })
    .eq("id", leadId)
    .select("id,status,lost_reason,updated_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmLeadUpdated({
      actorUserId: userId,
      leadId,
      fromStatus: from,
      toStatus: data.status,
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.LEAD_UPDATE_STATUS,
      entityType: "crm_leads",
      entityId: leadId,
      beforeSnapshot: { status: from },
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export type ConvertCrmLeadInput = {
  clientType: "individual" | "company";
  phone: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

/** Conversion lead → client + statut converted (B1.5). */
export async function convertCrmLeadToClient(
  userId: string,
  leadId: string,
  input: ConvertCrmLeadInput,
) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.LEAD_CONVERT, "update");

  const supabase = getSupabaseServerClient();
  const lead = await loadLead(supabase, leadId);
  assertLeadStatusTransition(lead.status as CrmLeadStatus, "converted");

  const client = await createClient(
    {
      client_type: input.clientType,
      first_name: input.firstName ?? lead.contact_first_name,
      last_name: input.lastName ?? lead.contact_last_name,
      company_name: input.companyName ?? lead.company_name,
      email: lead.email,
      phone: input.phone,
      address: null,
      city: null,
      country: null,
      notes: lead.notes,
    },
    userId,
  );

  const { data, error } = await supabase
    .from("crm_leads")
    .update({
      status: "converted",
      converted_client_id: client.id,
    })
    .eq("id", leadId)
    .select("id,status,converted_client_id")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmLeadConverted({
      actorUserId: userId,
      leadId,
      clientId: client.id,
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.LEAD_CONVERT,
      entityType: "crm_leads",
      entityId: leadId,
      afterSnapshot: { lead: data, client_id: client.id },
    }),
  ]);

  return { lead: data, client };
}

export type CreateCrmOpportunityInput = {
  title: string;
  stageId: string;
  clientId?: string | null;
  leadId?: string | null;
  amountEstimatedGnf?: number;
  expectedCloseDate?: string | null;
};

export async function createCrmOpportunity(userId: string, input: CreateCrmOpportunityInput) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.OPPORTUNITY_CREATE, "create");

  const title = input.title.trim();
  if (!title) throw new Error("Le titre de l'opportunité est obligatoire.");

  const supabase = getSupabaseServerClient();
  const { data: stage, error: stageErr } = await supabase
    .from("crm_pipeline_stages")
    .select("id,is_terminal_win,is_terminal_loss")
    .eq("id", input.stageId)
    .maybeSingle();

  if (stageErr) throw new Error(stageErr.message);
  if (!stage || isTerminalPipelineStage(stage)) {
    throw new Error("Étape pipeline invalide pour une nouvelle opportunité.");
  }

  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert({
      title,
      stage_id: input.stageId,
      client_id: input.clientId ?? null,
      lead_id: input.leadId ?? null,
      amount_estimated_gnf: Math.max(0, Number(input.amountEstimatedGnf ?? 0)),
      expected_close_date: input.expectedCloseDate ?? null,
      owner_id: userId,
      created_by: userId,
    })
    .select("id,title,stage_id,client_id,created_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmDealCreated({
      actorUserId: userId,
      opportunityId: data.id,
      title: data.title,
      stageId: data.stage_id,
      amountEstimatedGnf: Math.max(0, Number(input.amountEstimatedGnf ?? 0)),
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.OPPORTUNITY_CREATE,
      entityType: "crm_opportunities",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateCrmOpportunityStage(
  userId: string,
  opportunityId: string,
  nextStageId: string,
  lostReason?: string | null,
) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.OPPORTUNITY_UPDATE_STAGE, "update");

  const supabase = getSupabaseServerClient();
  const opp = await loadOpportunity(supabase, opportunityId);
  const currentStage = Array.isArray(opp.crm_pipeline_stages)
    ? opp.crm_pipeline_stages[0]
    : opp.crm_pipeline_stages;
  if (currentStage && isTerminalPipelineStage(currentStage)) {
    throw new Error("crm:opportunity_terminal");
  }

  const { data: nextStage, error: stageErr } = await supabase
    .from("crm_pipeline_stages")
    .select("id,code,is_terminal_win,is_terminal_loss")
    .eq("id", nextStageId)
    .maybeSingle();

  if (stageErr || !nextStage) throw new Error("Étape pipeline cible introuvable.");

  const { data, error } = await supabase
    .from("crm_opportunities")
    .update({
      stage_id: nextStageId,
      lost_reason: nextStage.is_terminal_loss ? (lostReason?.trim() || null) : opp.lost_reason,
    })
    .eq("id", opportunityId)
    .select("id,title,stage_id,lost_reason,updated_at")
    .single();

  if (error) throw new Error(error.message);

  const eventPromises: Promise<void>[] = [
    emitCrmPipelineUpdated({
      actorUserId: userId,
      opportunityId,
      fromStageId: opp.stage_id,
      toStageId: nextStageId,
      stageCode: nextStage.code,
    }),
  ];

  if (nextStage.is_terminal_win) {
    eventPromises.push(
      emitCrmDealWon({
        actorUserId: userId,
        opportunityId,
        amountGnf: Number(opp.amount_estimated_gnf ?? 0),
        stageCode: nextStage.code,
      }),
    );
  } else if (nextStage.is_terminal_loss) {
    eventPromises.push(
      emitCrmDealLost({
        actorUserId: userId,
        opportunityId,
        lostReason: data.lost_reason,
        stageCode: nextStage.code,
      }),
    );
  }

  await Promise.all([
    ...eventPromises,
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.OPPORTUNITY_UPDATE_STAGE,
      entityType: "crm_opportunities",
      entityId: opportunityId,
      beforeSnapshot: { stage_id: opp.stage_id },
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export type CreateCrmQuoteInput = {
  clientId: string;
  opportunityId?: string | null;
  validUntil?: string | null;
  notes?: string | null;
};

export async function createCrmQuote(userId: string, input: CreateCrmQuoteInput) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.QUOTE_CREATE, "create");

  const clientId = input.clientId.trim();
  if (!clientId) throw new Error("Le client est obligatoire pour un devis.");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("crm_quotes")
    .insert({
      client_id: clientId,
      opportunity_id: input.opportunityId ?? null,
      status: "draft",
      valid_until: input.validUntil ?? null,
      notes: input.notes?.trim() || null,
      created_by: userId,
    })
    .select("id,quote_number,client_id,status,created_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmQuoteCreated({
      actorUserId: userId,
      quoteId: data.id,
      quoteNumber: data.quote_number,
      clientId: data.client_id,
      status: data.status,
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.QUOTE_CREATE,
      entityType: "crm_quotes",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateCrmQuoteStatus(
  userId: string,
  quoteId: string,
  nextStatus: CrmQuoteStatus,
) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.QUOTE_UPDATE_STATUS, "update");

  const supabase = getSupabaseServerClient();
  const quote = await loadQuote(supabase, quoteId);
  const from = quote.status as CrmQuoteStatus;
  assertQuoteStatusTransition(from, nextStatus);

  if (nextStatus === "converted") {
    throw new Error("crm:quote_convert_use_b22");
  }

  const { data, error } = await supabase
    .from("crm_quotes")
    .update({ status: nextStatus })
    .eq("id", quoteId)
    .select("id,quote_number,status,updated_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmQuoteStatusUpdated({
      actorUserId: userId,
      quoteId,
      fromStatus: from,
      toStatus: data.status,
      quoteNumber: data.quote_number,
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.QUOTE_UPDATE_STATUS,
      entityType: "crm_quotes",
      entityId: quoteId,
      beforeSnapshot: { status: from },
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export type CreateCrmActivityInput = {
  activityType: "call" | "meeting" | "task" | "email" | "note";
  subject: string;
  relatedKind: "lead" | "opportunity" | "client" | "quote" | "sale";
  relatedId: string;
  dueAt?: string | null;
  body?: string | null;
};

export async function createCrmActivity(userId: string, input: CreateCrmActivityInput) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.ACTIVITY_CREATE, "create");

  const subject = input.subject.trim();
  if (!subject) throw new Error("Le sujet de l'activité est obligatoire.");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      activity_type: input.activityType,
      subject,
      body: input.body?.trim() || null,
      due_at: input.dueAt ?? null,
      related_kind: input.relatedKind,
      related_id: input.relatedId,
      owner_id: userId,
      created_by: userId,
    })
    .select("id,activity_type,subject,related_kind,related_id,created_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmActivityCreated({
      actorUserId: userId,
      activityId: data.id,
      activityType: data.activity_type,
      subject: data.subject,
      relatedKind: data.related_kind,
      relatedId: data.related_id,
    }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.ACTIVITY_CREATE,
      entityType: "crm_activities",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function completeCrmActivity(userId: string, activityId: string) {
  await assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.ACTIVITY_COMPLETE, "update");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("crm_activities")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", activityId)
    .is("deleted_at", null)
    .is("completed_at", null)
    .select("id,completed_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitCrmActivityCompleted({ actorUserId: userId, activityId }),
    recordCrmGovernanceAudit({
      actionType: CRM_WRITE_ACTIONS.ACTIVITY_COMPLETE,
      entityType: "crm_activities",
      entityId: activityId,
      afterSnapshot: data,
    }),
  ]);

  return data;
}
