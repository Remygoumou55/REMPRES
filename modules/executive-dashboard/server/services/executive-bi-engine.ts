/**
 * BI Engine — agrégation KPI depuis registre canonique (ONE KPI TRUTH).
 */

import { format, startOfMonth } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { BI_KPI_REGISTRY } from "@/lib/executive/runtime/bi-kpi-registry";
import { emitAnalyticsSnapshotComputed } from "@/lib/erp-core/events/integrations/executive-events";

export const EXECUTIVE_BI_ENGINE_SOURCE = "executive-bi-engine-bloc3-v1" as const;

export type ExecutiveBiKpiValue = {
  kpiKey: string;
  label: string;
  domainKey: string;
  unit: string;
  value: number;
  status: "ok" | "warning" | "critical";
};

export type ExecutiveBiSnapshot = {
  source: typeof EXECUTIVE_BI_ENGINE_SOURCE;
  periodStart: string;
  kpis: ExecutiveBiKpiValue[];
  computedAt: string;
};

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function evaluateStatus(
  value: number,
  warning: number | null,
  critical: number | null,
): "ok" | "warning" | "critical" {
  if (critical != null && value >= critical) return "critical";
  if (warning != null && value >= warning) return "warning";
  return "ok";
}

async function resolveKpiValue(
  kpiKey: string,
  _monthStartIso: string,
  ctx: {
    revenue: number;
    expenses: number;
    pipelineOpen: number;
    tasksBacklog: number;
    approvalsPending: number;
    incidentsOpen: number;
    deliveryDelayed: number;
    leadsOpen: number;
  },
): Promise<number> {
  switch (kpiKey) {
    case "company.revenue_month":
      return ctx.revenue;
    case "company.expenses_month":
      return ctx.expenses;
    case "company.net_margin":
      return ctx.revenue - ctx.expenses;
    case "crm.pipeline_open":
      return ctx.pipelineOpen;
    case "crm.leads_open":
      return ctx.leadsOpen;
    case "ops.tasks_backlog":
      return ctx.tasksBacklog;
    case "ops.delivery_delayed":
      return ctx.deliveryDelayed;
    case "governance.approvals_pending":
      return ctx.approvalsPending;
    case "observability.incidents_open":
      return ctx.incidentsOpen;
    default:
      return 0;
  }
}

export async function buildExecutiveBiSnapshot(
  supabase: SupabaseClient<Database>,
): Promise<ExecutiveBiSnapshot> {
  const periodStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthStartIso = `${periodStart}T00:00:00`;

  const [sales, expenses, pipeline, tasks, approvals, incidents, deliveries, leads] =
    await Promise.all([
      supabase.from("sales").select("total_amount_gnf").gte("created_at", monthStartIso),
      supabase.from("expenses").select("amount_gnf").gte("created_at", monthStartIso),
      supabase
        .from("crm_opportunities")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("erp_ops_tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "in_progress", "blocked"]),
      supabase
        .from("approval_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("erp_observability_incidents")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "investigating"]),
      supabase
        .from("erp_ops_deliveries")
        .select("id", { count: "exact", head: true })
        .eq("status", "delayed"),
      supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "contacted", "qualified"]),
    ]);

  const revenue = (sales.data ?? []).reduce((s, r) => s + toNum(r.total_amount_gnf), 0);
  const expenseTotal = (expenses.data ?? []).reduce((s, r) => s + toNum(r.amount_gnf), 0);

  const ctx = {
    revenue,
    expenses: expenseTotal,
    pipelineOpen: pipeline.count ?? 0,
    tasksBacklog: tasks.count ?? 0,
    approvalsPending: approvals.count ?? 0,
    incidentsOpen: incidents.count ?? 0,
    deliveryDelayed: deliveries.count ?? 0,
    leadsOpen: leads.count ?? 0,
  };

  const kpis: ExecutiveBiKpiValue[] = [];
  for (const def of BI_KPI_REGISTRY) {
    const value = await resolveKpiValue(def.kpiKey, monthStartIso, ctx);
    kpis.push({
      kpiKey: def.kpiKey,
      label: def.label,
      domainKey: def.domainKey,
      unit: def.unit,
      value,
      status: evaluateStatus(value, def.warningThreshold, def.criticalThreshold),
    });
  }

  const snapshot: ExecutiveBiSnapshot = {
    source: EXECUTIVE_BI_ENGINE_SOURCE,
    periodStart,
    kpis,
    computedAt: new Date().toISOString(),
  };

  const rows = kpis.map((k) => ({
    kpi_key: k.kpiKey,
    period_start: periodStart,
    value_numeric: k.value,
    source_hash: EXECUTIVE_BI_ENGINE_SOURCE,
  }));

  const { error } = await supabase.from("erp_bi_kpi_snapshots").upsert(rows, {
    onConflict: "kpi_key,period_start",
  });
  if (error) console.warn("[executive-bi-engine]", error.message);

  return snapshot;
}

export async function publishExecutiveBiSnapshot(
  supabase: SupabaseClient<Database>,
  actorUserId: string,
): Promise<ExecutiveBiSnapshot> {
  const snapshot = await buildExecutiveBiSnapshot(supabase);
  await emitAnalyticsSnapshotComputed({
    actorUserId,
    scopeKey: `bi_snapshot_${snapshot.periodStart}`,
    kpiCount: snapshot.kpis.length,
  });
  return snapshot;
}
