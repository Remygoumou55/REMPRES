"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidateCrm, revalidateVente } from "@/lib/cache/revalidation-map";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import type { CrmLeadStatus, CrmQuoteStatus } from "@/lib/vente/runtime/crm-state-machine";
import {
  completeCrmActivity,
  convertCrmLeadToClient,
  createCrmActivity,
  createCrmLead,
  createCrmOpportunity,
  createCrmQuote,
  updateCrmLeadStatus,
  updateCrmOpportunityStage,
  updateCrmQuoteStatus,
} from "@/modules/crm/server/services/crm-mutations";
import { convertCrmQuoteToSale } from "@/modules/crm/server/services/quote-sale-conversion";
import { refreshCrmForecastSnapshot } from "@/modules/crm/server/services/crm-analytics-service";

function mapCrmActionError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.startsWith("crm:")) {
      return "Action CRM refusée par la gouvernance runtime.";
    }
    return e.message;
  }
  return "Erreur CRM inattendue.";
}

async function requireUserId(): Promise<string | SafeResult<never>> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return data.user.id;
}

function afterCrmMutation() {
  void revalidateCrm();
}

export async function createCrmLeadAction(input: {
  companyName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  phone?: string;
  source?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createCrmLead(userId, input);
    afterCrmMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function updateCrmLeadStatusAction(
  leadId: string,
  nextStatus: CrmLeadStatus,
  lostReason?: string,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await updateCrmLeadStatus(userId, leadId, nextStatus, lostReason);
    afterCrmMutation();
    return ok(null);
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function convertCrmLeadAction(
  leadId: string,
  input: {
    clientType: "individual" | "company";
    phone: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  },
): Promise<SafeResult<{ clientId: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const { client } = await convertCrmLeadToClient(userId, leadId, input);
    afterCrmMutation();
    return ok({ clientId: client.id });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function createCrmOpportunityAction(input: {
  title: string;
  stageId: string;
  clientId?: string;
  leadId?: string;
  amountEstimatedGnf?: number;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createCrmOpportunity(userId, input);
    afterCrmMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function updateCrmOpportunityStageAction(
  opportunityId: string,
  nextStageId: string,
  lostReason?: string,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await updateCrmOpportunityStage(userId, opportunityId, nextStageId, lostReason);
    afterCrmMutation();
    return ok(null);
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function createCrmQuoteAction(input: {
  clientId: string;
  opportunityId?: string;
  validUntil?: string;
  notes?: string;
}): Promise<SafeResult<{ id: string; quoteNumber: string | null }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createCrmQuote(userId, input);
    afterCrmMutation();
    return ok({ id: row.id, quoteNumber: row.quote_number });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function updateCrmQuoteStatusAction(
  quoteId: string,
  nextStatus: CrmQuoteStatus,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await updateCrmQuoteStatus(userId, quoteId, nextStatus);
    afterCrmMutation();
    return ok(null);
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function convertCrmQuoteToSaleAction(
  quoteId: string,
  paymentMethod?: "cash" | "mobile_money" | "bank_transfer",
): Promise<SafeResult<{ saleId: string; saleReference: string | null }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const result = await convertCrmQuoteToSale(userId, { quoteId, paymentMethod });
    afterCrmMutation();
    await revalidateVente({ saleId: result.saleId });
    return ok({ saleId: result.saleId, saleReference: result.saleReference });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function createCrmActivityAction(input: {
  activityType: "call" | "meeting" | "task" | "email" | "note";
  subject: string;
  relatedKind: "lead" | "opportunity" | "client" | "quote" | "sale";
  relatedId: string;
  dueAt?: string;
  body?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createCrmActivity(userId, input);
    afterCrmMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function refreshCrmForecastAction(): Promise<SafeResult<{ snapshotId: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const supabase = getSupabaseServerClient();
    const { id } = await refreshCrmForecastSnapshot(supabase, userId);
    afterCrmMutation();
    return ok({ snapshotId: id });
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}

export async function completeCrmActivityAction(activityId: string): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await completeCrmActivity(userId, activityId);
    afterCrmMutation();
    return ok(null);
  } catch (e) {
    return err(mapCrmActionError(e));
  }
}
