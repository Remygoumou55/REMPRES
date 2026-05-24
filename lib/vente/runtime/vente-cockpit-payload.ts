/**
 * B2.3 — Contrat payload B2.4 (référence tests / gouvernance).
 * Runtime cockpit dept = DeptHomePage + getDeptDashboardData sur `/dept/vente`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RecentActivityEntry } from "@/lib/server/dashboard-kpis";
import type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";
import { getVenteRuntimeKpiBundle } from "@/lib/vente/runtime/vente-kpi-runtime";
import { VENTE_COMMERCE_KPI_SOURCE } from "@/lib/vente/runtime/vente-commerce-kpis";
import { CRM_OPERATIONAL_KPI_SOURCE } from "@/modules/crm/server/services/crm-overview";

export const VENTE_COCKPIT_PAYLOAD_SOURCE = "vente-cockpit-runtime-v1" as const;

const VENTE_ACTIVITY_MODULE_KEYS = ["clients", "produits", "vente", "sales", "products"] as const;

export type VenteCockpitAlertLevel = "critical" | "warning" | "info";

export type VenteCockpitAlert = {
  id: string;
  level: VenteCockpitAlertLevel;
  message: string;
  href: string;
};

export type VenteCockpitQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export const OFFICIAL_VENTE_COCKPIT_QUICK_ACTIONS: readonly VenteCockpitQuickAction[] = [
  { id: "new_sale", label: "Nouvelle vente", description: "Enregistrer une vente", href: "/vente/nouvelle-vente" },
  { id: "new_client", label: "Clients", description: "Gérer la base clients", href: "/vente/clients" },
  { id: "new_lead", label: "Nouveau lead", description: "Prospection CRM", href: "/vente/crm/leads" },
  { id: "new_quote", label: "Devis", description: "Créer ou suivre les devis", href: "/vente/crm/quotes" },
  { id: "pipeline", label: "Pipeline", description: "Vue pipeline commercial", href: "/vente/crm/pipeline" },
  { id: "crm_hub", label: "Pilotage CRM", description: "Hub opérationnel CRM", href: "/vente/crm" },
] as const;

export type VenteCockpitPayload = {
  source: typeof VENTE_COCKPIT_PAYLOAD_SOURCE;
  generatedAt: string;
  userDisplayName: string;
  commerceSource: typeof VENTE_COMMERCE_KPI_SOURCE;
  crmSource: typeof CRM_OPERATIONAL_KPI_SOURCE;
  netRevenueToday: number;
  netRevenueMonth: number;
  salesCountToday: number;
  clientsTotal: number;
  activeLeads: number;
  openOpportunities: number;
  openQuotes: number;
  openActivities: number;
  weightedPipelineGnf: number;
  productsLowStock: number;
  productsOutOfStock: number;
  salesLast7Days: DayStats[];
  alerts: VenteCockpitAlert[];
  recentActivity: RecentActivityEntry[];
  quickActions: readonly VenteCockpitQuickAction[];
};

async function fetchVenteCommercialActivity(
  supabase: SupabaseClient<Database>,
  limit = 12,
): Promise<RecentActivityEntry[]> {
  const { data: recentLogs, error } = await supabase
    .from("activity_logs")
    .select("id, action_key, module_key, created_at, actor_user_id")
    .in("module_key", [...VENTE_ACTIVITY_MODULE_KEYS])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const actorIds = Array.from(
    new Set((recentLogs ?? []).map((l) => l.actor_user_id).filter((id): id is string => Boolean(id))),
  );

  const actorNames: Record<string, string> = {};
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      if (name) actorNames[p.id] = name;
    }
  }

  return (recentLogs ?? []).map((l) => ({
    id: l.id,
    action_key: l.action_key,
    module_key: l.module_key,
    actor_display_name: l.actor_user_id ? (actorNames[l.actor_user_id] ?? null) : null,
    created_at: l.created_at,
  }));
}

async function countQuotesExpiringWithinDays(
  supabase: SupabaseClient<Database>,
  days: number,
  now = new Date(),
): Promise<number> {
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  const end = endDate.toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("crm_quotes")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("status", "sent")
    .not("valid_until", "is", null)
    .gte("valid_until", start)
    .lte("valid_until", end);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

function buildVenteCockpitAlerts(input: {
  productsOutOfStock: number;
  productsLowStock: number;
  quotesExpiring7d: number;
  cancelledToday: number;
  netToday: number;
}): VenteCockpitAlert[] {
  const alerts: VenteCockpitAlert[] = [];

  if (input.productsOutOfStock > 0) {
    alerts.push({
      id: "stock_blocks_sale",
      level: "critical",
      message: `${input.productsOutOfStock} produit(s) en rupture — ventes potentiellement bloquées`,
      href: "/vente/produits",
    });
  }

  if (input.productsLowStock > 0) {
    alerts.push({
      id: "stock_low",
      level: "warning",
      message: `${input.productsLowStock} produit(s) sous seuil de stock`,
      href: "/vente/produits",
    });
  }

  if (input.quotesExpiring7d > 0) {
    alerts.push({
      id: "quote_expiring",
      level: input.quotesExpiring7d >= 3 ? "critical" : "warning",
      message: `${input.quotesExpiring7d} devis envoyé(s) expirent sous 7 jours`,
      href: "/vente/crm/quotes",
    });
  }

  if (input.cancelledToday > 0 && input.netToday > 0 && input.cancelledToday >= input.netToday * 0.25) {
    alerts.push({
      id: "cancellation_spike",
      level: "warning",
      message: "Annulations du jour élevées par rapport au CA net",
      href: "/vente/historique",
    });
  }

  return alerts.slice(0, 8);
}

/**
 * Source unique cockpit manager Vente — interdit d'appeler getDashboardKpis ou dept API directement.
 */
export async function getVenteCockpitPayload(
  supabase: SupabaseClient<Database>,
  userId: string,
  userDisplayName: string,
  now = new Date(),
): Promise<VenteCockpitPayload> {
  const [bundle, recentActivity, quotesExpiring7d] = await Promise.all([
    getVenteRuntimeKpiBundle(supabase, userId, now),
    fetchVenteCommercialActivity(supabase),
    countQuotesExpiringWithinDays(supabase, 7, now),
  ]);

  const { commerce, crm } = bundle;

  const alerts = buildVenteCockpitAlerts({
    productsOutOfStock: commerce.productsOutOfStock,
    productsLowStock: commerce.productsLowStock,
    quotesExpiring7d,
    cancelledToday: commerce.cancelledSaleAmountToday,
    netToday: commerce.netSaleAmountToday,
  });

  return {
    source: VENTE_COCKPIT_PAYLOAD_SOURCE,
    generatedAt: bundle.generatedAt,
    userDisplayName,
    commerceSource: commerce.source,
    crmSource: crm.source,
    netRevenueToday: commerce.netSaleAmountToday,
    netRevenueMonth: commerce.netSaleAmountMonth,
    salesCountToday: commerce.salesTodayCount,
    clientsTotal: commerce.clientsTotal,
    activeLeads: crm.activeLeads,
    openOpportunities: crm.openOpportunities,
    openQuotes: crm.openQuotes,
    openActivities: crm.openActivities,
    weightedPipelineGnf: crm.weightedPipelineGnf,
    productsLowStock: commerce.productsLowStock,
    productsOutOfStock: commerce.productsOutOfStock,
    salesLast7Days: commerce.salesLast7Days,
    alerts,
    recentActivity,
    quickActions: OFFICIAL_VENTE_COCKPIT_QUICK_ACTIONS,
  };
}
