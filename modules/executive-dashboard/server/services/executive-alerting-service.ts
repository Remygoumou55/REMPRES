/**
 * Executive alerting — signaux proactifs cross-domain.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  emitExecutiveKpiThresholdExceeded,
  emitExecutiveSignalRaised,
} from "@/lib/erp-core/events/integrations/executive-events";
import { buildExecutiveBiSnapshot } from "@/modules/executive-dashboard/server/services/executive-bi-engine";

export const EXECUTIVE_ALERTING_SOURCE = "executive-alerting-bloc3-v1" as const;

export type ExecutiveSignalRow = {
  signalKey: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  sourceDomain: string;
};

export async function evaluateAndPersistExecutiveSignals(
  supabase: SupabaseClient<Database>,
  actorUserId: string,
): Promise<ExecutiveSignalRow[]> {
  const bi = await buildExecutiveBiSnapshot(supabase);
  const signals: ExecutiveSignalRow[] = [];

  for (const kpi of bi.kpis) {
    if (kpi.status === "ok") continue;
    const signalKey = `signal_${kpi.kpiKey}_${bi.periodStart}`;
    const severity = kpi.status === "critical" ? "critical" : "warning";
    signals.push({
      signalKey,
      severity,
      title: `Seuil KPI — ${kpi.label}`,
      body: `Valeur ${kpi.value} (${kpi.unit}) — statut ${kpi.status}`,
      sourceDomain: kpi.domainKey,
    });
    await emitExecutiveKpiThresholdExceeded({
      actorUserId,
      kpiKey: kpi.kpiKey,
      value: kpi.value,
      status: kpi.status,
    });
  }

  const marginKpi = bi.kpis.find((k) => k.kpiKey === "company.net_margin");
  if (marginKpi && marginKpi.value < 0) {
    signals.push({
      signalKey: `signal_cashflow_risk_${bi.periodStart}`,
      severity: "critical",
      title: "Risque trésorerie",
      body: "Marge nette négative sur la période en cours.",
      sourceDomain: "finance",
    });
  }

  for (const sig of signals) {
    const { error } = await supabase.from("erp_executive_signals").upsert(
      {
        signal_key: sig.signalKey,
        severity: sig.severity,
        title: sig.title,
        body: sig.body,
        source_domain: sig.sourceDomain,
        status: "open",
        metadata: { period_start: bi.periodStart },
      },
      { onConflict: "signal_key" },
    );
    if (error) console.warn("[executive-alerting]", error.message);
    else {
      await emitExecutiveSignalRaised({
        actorUserId,
        signalKey: sig.signalKey,
        severity: sig.severity,
        sourceDomain: sig.sourceDomain,
      });
    }
  }

  return signals;
}

export async function runExecutiveAlertingCycle(actorUserId: string): Promise<ExecutiveSignalRow[]> {
  const supabase = getSupabaseServerClient();
  return evaluateAndPersistExecutiveSignals(supabase, actorUserId);
}

export async function listOpenExecutiveSignals(
  supabase: SupabaseClient<Database>,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("erp_executive_signals")
    .select("id,signal_key,severity,title,body,source_domain,status,created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
