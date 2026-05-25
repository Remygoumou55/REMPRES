/**
 * Cross-domain intelligence — corrélations métier RH / Finance / CRM / Supply / Operations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const EXECUTIVE_CROSS_DOMAIN_SOURCE = "executive-cross-domain-bloc3-v1" as const;

export type CrossDomainInsight = {
  id: string;
  domains: [string, string];
  insight: string;
  metricA: number;
  metricB: number;
  correlation: "positive" | "negative" | "neutral";
  severity: "info" | "warning";
};

export type CrossDomainIntelligenceBundle = {
  source: typeof EXECUTIVE_CROSS_DOMAIN_SOURCE;
  insights: CrossDomainInsight[];
  generatedAt: string;
};

export async function buildCrossDomainIntelligence(
  supabase: SupabaseClient<Database>,
): Promise<CrossDomainIntelligenceBundle> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [sales, expenses, deals, inventory, tasks, contracts] = await Promise.all([
    supabase.from("sales").select("total_amount_gnf").gte("created_at", monthStart),
    supabase.from("expenses").select("amount_gnf").gte("created_at", monthStart),
    supabase
      .from("crm_opportunities")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase.from("logistics_inventory_balances").select("qty_on_hand"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["todo", "in_progress", "blocked"]),
    supabase
      .from("rh_employee_contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const revenue = (sales.data ?? []).reduce((s, r) => s + Number(r.total_amount_gnf ?? 0), 0);
  const expenseTotal = (expenses.data ?? []).reduce((s, r) => s + Number(r.amount_gnf ?? 0), 0);
  const margin = revenue - expenseTotal;
  const stockQty = (inventory.data ?? []).reduce((s, r) => s + Number(r.qty_on_hand ?? 0), 0);
  const pipeline = deals.count ?? 0;
  const taskBacklog = tasks.count ?? 0;
  const headcount = contracts.count ?? 0;

  const insights: CrossDomainInsight[] = [];

  insights.push({
    id: "sales-finance",
    domains: ["vente", "finance"],
    insight:
      margin >= 0
        ? "Revenus couvrent les dépenses du mois — marge positive."
        : "Dépenses supérieures aux revenus — risque trésorerie.",
    metricA: revenue,
    metricB: expenseTotal,
    correlation: margin >= 0 ? "positive" : "negative",
    severity: margin >= 0 ? "info" : "warning",
  });

  insights.push({
    id: "crm-ops",
    domains: ["vente", "consultation"],
    insight:
      pipeline > 0 && taskBacklog > 0
        ? "Pipeline commercial alimente la charge opérationnelle (tâches ouvertes)."
        : "Pipeline ou backlog ops faible — capacité disponible.",
    metricA: pipeline,
    metricB: taskBacklog,
    correlation: pipeline > 0 && taskBacklog > 0 ? "positive" : "neutral",
    severity: taskBacklog > 15 ? "warning" : "info",
  });

  insights.push({
    id: "supply-ops",
    domains: ["logistique", "consultation"],
    insight:
      stockQty > 0
        ? "Stock disponible pour exécution livraison / projets."
        : "Stock faible — risque sur jalons livraison.",
    metricA: stockQty,
    metricB: taskBacklog,
    correlation: stockQty > taskBacklog ? "positive" : "negative",
    severity: stockQty < 10 ? "warning" : "info",
  });

  insights.push({
    id: "rh-ops",
    domains: ["rh", "consultation"],
    insight:
      headcount > 0
        ? `Ratio charge : ${(taskBacklog / Math.max(headcount, 1)).toFixed(1)} tâches / contrat actif.`
        : "Effectifs non renseignés — charge ops non normalisée.",
    metricA: headcount,
    metricB: taskBacklog,
    correlation: "neutral",
    severity: taskBacklog / Math.max(headcount, 1) > 5 ? "warning" : "info",
  });

  return {
    source: EXECUTIVE_CROSS_DOMAIN_SOURCE,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
