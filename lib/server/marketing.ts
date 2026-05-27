import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getDeptActivityModuleKeys } from "@/lib/dept/dashboard-module-keys";
import { safeCount, safeRows } from "@/lib/utils/safe-query";
import type {
  Campaign,
  CampaignStatus,
  CreateCampaignInput,
  CreateLeadInput,
  Lead,
  LeadStatus,
  UpdateCampaignInput,
  UpdateLeadInput,
} from "@/lib/types/marketing";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { AlertItem, ChartPoint } from "@/lib/server/dept-dashboard";

/**
 * Marketing — source de vérité leads : table `leads` (campagnes, `campaign_id`).
 *
 * Distinct de `crm_leads` (pipeline commercial /vente/crm). Ne pas fusionner les requêtes.
 * Audit : docs/DUPLICATE_TABLES_AUDIT.md § Paire 3.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function field<T>(row: T, key: keyof T): unknown {
  return row?.[key];
}

function normalizeCampaignRow(
  row: Campaign,
  leadsCount = 0,
): Campaign {
  return {
    ...row,
    sent_count: Number(row.sent_count ?? 0),
    open_count: Number(row.open_count ?? 0),
    click_count: Number(row.click_count ?? 0),
    conversion_count: Number(row.conversion_count ?? 0),
    notes: row.notes ?? null,
    leads_count: leadsCount,
  };
}

async function countLeadsByCampaign(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<Map<string, number>> {
  const leadCountsRows = await safeRows<{ campaign_id: string }>(
    supabase.from("leads" as never).select("campaign_id").is("deleted_at", null),
  );
  const map = new Map<string, number>();
  leadCountsRows.forEach((r) => {
    const cid = String(field(r, "campaign_id") ?? "");
    if (cid) map.set(cid, (map.get(cid) ?? 0) + 1);
  });
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════

type ListCampaignsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
};

export async function listCampaigns(
  params: ListCampaignsParams = {},
): Promise<{
  data: Campaign[];
  total: number;
  totalBudget: number;
  activeCount: number;
  totalLeads: number;
}> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("campaigns" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type);
  }
  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `title.ilike.%${s}%,description.ilike.%${s}%,goal.ilike.%${s}%,channel.ilike.%${s}%`,
    );
  }

  const [result, leadsByCampaign, activeCount, totalBudgetRows, totalLeads] =
    await Promise.all([
      query.range(from, to),
      countLeadsByCampaign(supabase),
      safeCount(
        supabase
          .from("campaigns" as never)
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .is("deleted_at", null),
      ),
      safeRows<{ budget_gnf: number }>(
        supabase
          .from("campaigns" as never)
          .select("budget_gnf")
          .is("deleted_at", null),
      ),
      safeCount(
        supabase
          .from("leads" as never)
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null),
      ),
    ]);

  const rows = (result.error ? [] : (result.data ?? [])) as Campaign[];

  const enriched = rows.map((c) =>
    normalizeCampaignRow(c, leadsByCampaign.get(c.id) ?? 0),
  );

  const totalBudget = totalBudgetRows.reduce(
    (acc, r) => acc + Number(r.budget_gnf ?? 0),
    0,
  );
  return {
    data: enriched,
    total: result.error ? 0 : (result.count ?? 0),
    totalBudget,
    activeCount,
    totalLeads,
  };
}

export async function listCampaignsWithMetrics(
  params: ListCampaignsParams = {},
): Promise<{
  data: Campaign[];
  total: number;
  totalBudget: number;
  activeCount: number;
  totalLeads: number;
}> {
  return listCampaigns(params);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;

  const leadsCount = await safeCount(
    supabase
      .from("leads" as never)
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", id)
      .is("deleted_at", null),
  );

  return normalizeCampaignRow(data as Campaign, leadsCount);
}

export async function updateCampaignMetrics(
  id: string,
  metrics: {
    sent_count: number;
    open_count: number;
    click_count: number;
    conversion_count: number;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();

  const sent = Math.max(0, Math.floor(metrics.sent_count));
  const open = Math.max(0, Math.floor(metrics.open_count));
  const click = Math.max(0, Math.floor(metrics.click_count));
  const conversion = Math.max(0, Math.floor(metrics.conversion_count));

  if (open > sent) {
    return {
      success: false,
      error: "Les ouvertures ne peuvent pas dépasser les envois.",
    };
  }
  if (click > open) {
    return {
      success: false,
      error: "Les clics ne peuvent pas dépasser les ouvertures.",
    };
  }
  if (conversion > sent) {
    return {
      success: false,
      error: "Les conversions ne peuvent pas dépasser les envois.",
    };
  }

  const { error } = await supabase
    .from("campaigns" as never)
    .update({
      sent_count: sent,
      open_count: open,
      click_count: click,
      conversion_count: conversion,
    } as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listCampaignsForSelect(): Promise<
  { id: string; label: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("campaigns" as never)
    .select("id,title,status")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as Array<{ id: string; title: string; status: string }>)
    .map((r) => ({
      id: r.id,
      label: `${r.title}${r.status !== "active" ? ` (${r.status})` : ""}`,
    }));
}

export async function countActiveCampaigns(): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("campaigns" as never)
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),
  );
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const title = String(input.title ?? "").trim();
  if (!title) return { success: false, error: "Le titre est obligatoire." };
  if (!input.type) return { success: false, error: "Le type est obligatoire." };

  const { data, error } = await supabase
    .from("campaigns" as never)
    .insert({
      title,
      description: input.description?.trim() || null,
      type: input.type,
      status: input.status ?? "draft",
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      budget_gnf: Number(input.budget_gnf ?? 0) || 0,
      target_audience: input.target_audience?.trim() || null,
      goal: input.goal?.trim() || null,
      channel: input.channel?.trim() || null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.type !== undefined) patch.type = input.type;
  if (input.status !== undefined) patch.status = input.status;
  if (input.start_date !== undefined) patch.start_date = input.start_date || null;
  if (input.end_date !== undefined) patch.end_date = input.end_date || null;
  if (input.budget_gnf !== undefined) patch.budget_gnf = Number(input.budget_gnf) || 0;
  if (input.target_audience !== undefined)
    patch.target_audience = input.target_audience || null;
  if (input.goal !== undefined) patch.goal = input.goal || null;
  if (input.channel !== undefined) patch.channel = input.channel || null;

  const { error } = await supabase
    .from("campaigns" as never)
    .update(patch as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function softDeleteCampaign(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("campaigns" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
): Promise<{ success: boolean; error?: string }> {
  return updateCampaign(id, { status });
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════════════════

type ListLeadsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  campaign_id?: string;
};

export async function listLeads(
  params: ListLeadsParams = {},
): Promise<{ data: Lead[]; total: number; byStatus: Record<string, number> }> {
  const supabase = getSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const limit = params.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("leads" as never)
    .select("*,campaign:campaigns(title)", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.source && params.source !== "all") query = query.eq("source", params.source);
  if (params.campaign_id) query = query.eq("campaign_id", params.campaign_id);

  if (params.search?.trim()) {
    const s = params.search.trim().replace(/,/g, "\\,");
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,company.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`,
    );
  }

  const [result, allStatusRows] = await Promise.all([
    query.range(from, to),
    safeRows<{ status: string }>(
      supabase.from("leads" as never).select("status").is("deleted_at", null),
    ),
  ]);

  const byStatus: Record<string, number> = {};
  allStatusRows.forEach((r) => {
    const s = String(r.status ?? "new");
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  });

  return {
    data: (result.error ? [] : (result.data ?? [])) as Lead[],
    total: result.error ? 0 : (result.count ?? 0),
    byStatus,
  };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads" as never)
    .select("*,campaign:campaigns(title)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return null;
  return (data as Lead | null) ?? null;
}

export async function countNewLeads(): Promise<number> {
  const supabase = getSupabaseServerClient();
  return safeCount(
    supabase
      .from("leads" as never)
      .select("*", { count: "exact", head: true })
      .eq("status", "new")
      .is("deleted_at", null),
  );
}

export async function createLead(
  input: CreateLeadInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const firstName = String(input.first_name ?? "").trim();
  const lastName = String(input.last_name ?? "").trim();
  if (!firstName || !lastName) {
    return { success: false, error: "Prénom et nom sont obligatoires." };
  }
  if (!input.source) {
    return { success: false, error: "La source est obligatoire." };
  }

  const { data, error } = await supabase
    .from("leads" as never)
    .insert({
      first_name: firstName,
      last_name: lastName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      source: input.source,
      campaign_id: input.campaign_id || null,
      status: input.status ?? "new",
      estimated_value_gnf: Number(input.estimated_value_gnf ?? 0) || 0,
      notes: input.notes?.trim() || null,
      created_by: input.created_by ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de création." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.first_name !== undefined) patch.first_name = input.first_name;
  if (input.last_name !== undefined) patch.last_name = input.last_name;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.company !== undefined) patch.company = input.company || null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.campaign_id !== undefined) patch.campaign_id = input.campaign_id || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.estimated_value_gnf !== undefined)
    patch.estimated_value_gnf = Number(input.estimated_value_gnf) || 0;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const { error } = await supabase
    .from("leads" as never)
    .update(patch as never)
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ success: boolean; error?: string }> {
  return updateLead(id, { status });
}

export async function softDeleteLead(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("leads" as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export type ConvertLeadToClientResult = {
  success: boolean;
  clientId?: string;
  alreadyExists?: boolean;
  requiresApproval?: boolean;
  error?: string;
};

async function incrementCampaignConversionCount(
  campaignId: string,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("campaigns" as never)
    .select("conversion_count")
    .eq("id", campaignId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return;

  const current = Number((data as { conversion_count?: number }).conversion_count ?? 0);
  await supabase
    .from("campaigns" as never)
    .update({ conversion_count: current + 1 } as never)
    .eq("id", campaignId);
}

export async function convertLeadToClient(
  leadId: string,
  userId: string,
): Promise<ConvertLeadToClientResult> {
  const supabase = getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const lead = await getLeadById(leadId);
  if (!lead) return { success: false, error: "Lead introuvable." };

  if (lead.status === "converted" || lead.converted_client_id) {
    return {
      success: false,
      error: "Ce lead est déjà converti.",
      clientId: lead.converted_client_id ?? undefined,
    };
  }

  if (lead.email?.trim()) {
    const { data: existing } = await admin
      .from("clients")
      .select("id")
      .eq("email", lead.email.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const existingId = String((existing as { id: string }).id);
      return {
        success: false,
        alreadyExists: true,
        clientId: existingId,
        error: `Un client avec l'email ${lead.email} existe déjà.`,
      };
    }
  }

  const clientType: "individual" | "company" = lead.company ? "company" : "individual";
  const conversionNote = `Converti depuis lead marketing le ${new Date().toLocaleDateString("fr-FR")}.`;
  const mergedNotes = [lead.notes, conversionNote].filter(Boolean).join("\n\n");

  const { data, error } = await admin
    .from("clients")
    .insert({
      client_type: clientType,
      first_name: lead.first_name,
      last_name: lead.last_name,
      company_name: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: mergedNotes || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Échec de conversion." };
  }
  const clientId = String((data as { id: string }).id);

  const { error: leadError } = await supabase
    .from("leads" as never)
    .update({
      status: "converted",
      converted_client_id: clientId,
      converted_at: new Date().toISOString(),
    } as never)
    .eq("id", leadId);

  if (leadError) {
    return { success: false, error: leadError.message };
  }

  if (lead.campaign_id) {
    try {
      await incrementCampaignConversionCount(lead.campaign_id);
    } catch (e) {
      console.error("[marketing] increment campaign conversion_count:", e);
    }
  }

  return { success: true, clientId };
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export type MarketingAnalytics = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  convertedLeads: number;
  conversionRate: number;
  totalBudgetGnf: number;
  estimatedPipelineGnf: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  chart7Days: ChartPoint[];
  topCampaigns: { id: string; title: string; leads: number; status: string }[];
};

export async function getMarketingAnalytics(): Promise<MarketingAnalytics> {
  const supabase = getSupabaseServerClient();
  const monthStart = monthStartIso();
  const sevenDaysAgo = sevenDaysAgoIso();

  const [
    totalCampaigns,
    activeCampaigns,
    totalLeads,
    newLeadsThisMonth,
    convertedLeads,
    budgetRows,
    pipelineRows,
    statusRows,
    sourceRows,
    chartRows,
    campaignRows,
    leadsForCampaign,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("campaigns" as never)
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("campaigns" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("leads" as never)
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("leads" as never)
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart)
        .is("deleted_at", null),
    ),
    safeCount(
      supabase
        .from("leads" as never)
        .select("*", { count: "exact", head: true })
        .eq("status", "converted")
        .is("deleted_at", null),
    ),
    safeRows<{ budget_gnf: number }>(
      supabase.from("campaigns" as never).select("budget_gnf").is("deleted_at", null),
    ),
    safeRows<{ estimated_value_gnf: number; status: string }>(
      supabase
        .from("leads" as never)
        .select("estimated_value_gnf,status")
        .is("deleted_at", null),
    ),
    safeRows<{ status: string }>(
      supabase.from("leads" as never).select("status").is("deleted_at", null),
    ),
    safeRows<{ source: string }>(
      supabase.from("leads" as never).select("source").is("deleted_at", null),
    ),
    safeRows<{ created_at: string }>(
      supabase
        .from("leads" as never)
        .select("created_at")
        .gte("created_at", sevenDaysAgo)
        .is("deleted_at", null),
    ),
    safeRows<{ id: string; title: string; status: string }>(
      supabase
        .from("campaigns" as never)
        .select("id,title,status")
        .is("deleted_at", null),
    ),
    safeRows<{ campaign_id: string }>(
      supabase.from("leads" as never).select("campaign_id").is("deleted_at", null),
    ),
  ]);

  const totalBudgetGnf = budgetRows.reduce(
    (acc, r) => acc + Number(r.budget_gnf ?? 0),
    0,
  );
  const estimatedPipelineGnf = pipelineRows
    .filter((r) => r.status !== "converted" && r.status !== "lost")
    .reduce((acc, r) => acc + Number(r.estimated_value_gnf ?? 0), 0);

  const statusMap = new Map<string, number>();
  statusRows.forEach((r) => {
    const s = String(r.status ?? "new");
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  });
  const leadsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const sourceMap = new Map<string, number>();
  sourceRows.forEach((r) => {
    const s = String(r.source ?? "autre");
    sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1);
  });
  const leadsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
    source,
    count,
  }));

  const chartMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    chartMap.set(d, 0);
  }
  chartRows.forEach((r) => {
    const d = String(r.created_at ?? "").slice(0, 10);
    if (chartMap.has(d)) chartMap.set(d, (chartMap.get(d) ?? 0) + 1);
  });
  const chart7Days: ChartPoint[] = Array.from(chartMap.entries()).map(
    ([date, value]) => ({ date, value }),
  );

  const leadsByCampaign = new Map<string, number>();
  leadsForCampaign.forEach((r) => {
    const cid = String(r.campaign_id ?? "");
    if (cid) leadsByCampaign.set(cid, (leadsByCampaign.get(cid) ?? 0) + 1);
  });
  const topCampaigns = campaignRows
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      leads: leadsByCampaign.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  return {
    totalCampaigns,
    activeCampaigns,
    totalLeads,
    newLeadsThisMonth,
    convertedLeads,
    conversionRate,
    totalBudgetGnf,
    estimatedPipelineGnf,
    leadsByStatus,
    leadsBySource,
    chart7Days,
    topCampaigns,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD KPIs
// ═══════════════════════════════════════════════════════════════════════════

export type MarketingDashboardKpis = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  convertedLeads: number;
  conversionRate: number;
  totalBudgetGnf: number;
  chart7Days: ChartPoint[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
};

export async function getMarketingDashboardKpis(): Promise<MarketingDashboardKpis> {
  const supabase = getSupabaseServerClient();
  const [analytics, activity] = await Promise.all([
    getMarketingAnalytics(),
    getRecentActivity(supabase, {
      moduleKeys: getDeptActivityModuleKeys("marketing"),
      limit: 8,
    }),
  ]);

  const alerts: AlertItem[] = [];
  if (analytics.activeCampaigns === 0 && analytics.totalCampaigns > 0) {
    alerts.push({
      id: "no-active-campaigns",
      level: "MEDIUM",
      title: "Aucune campagne active",
      description: "Activez ou créez une campagne pour générer des leads.",
      time: new Date().toISOString(),
    });
  }
  const newCount = analytics.leadsByStatus.find((s) => s.status === "new")?.count ?? 0;
  if (newCount >= 5) {
    alerts.push({
      id: "many-new-leads",
      level: "MEDIUM",
      title: `${newCount} leads à contacter`,
      description: "Des leads non traités s'accumulent — relancez le pipeline.",
      time: new Date().toISOString(),
    });
  }

  return {
    totalCampaigns: analytics.totalCampaigns,
    activeCampaigns: analytics.activeCampaigns,
    totalLeads: analytics.totalLeads,
    newLeadsThisMonth: analytics.newLeadsThisMonth,
    convertedLeads: analytics.convertedLeads,
    conversionRate: analytics.conversionRate,
    totalBudgetGnf: analytics.totalBudgetGnf,
    chart7Days: analytics.chart7Days,
    recentActivity: activity,
    alerts,
  };
}
