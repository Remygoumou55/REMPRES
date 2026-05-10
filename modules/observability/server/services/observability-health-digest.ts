import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";

const STALE_MINUTES = 45;

async function insertAnomalyOpen(
  admin: SupabaseClient<Database>,
  row: {
    rule_key: string;
    domain_key?: string;
    severity?: "low" | "medium" | "high" | "critical";
    entity_type?: string | null;
    entity_id?: string | null;
    anomaly_score: number;
    metadata?: Json;
  },
) {
  const { error } = await admin.from("erp_observability_anomalies").insert({
    rule_key: row.rule_key,
    domain_key: row.domain_key ?? "global",
    severity: row.severity ?? "medium",
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    anomaly_score: row.anomaly_score,
    status: "open",
    metadata: row.metadata ?? {},
  });
  if (error?.code === "23505") return;
  if (error) throw new Error(error.message);
}

export async function executeObservabilityHealthDigest(
  admin: SupabaseClient<Database>,
  _job: InfrastructureJobRow,
): Promise<void> {
  const t0 = Date.now();
  const traceId = crypto.randomUUID();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const staleBefore = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

  const [
    pendingJobs,
    failedJobs24h,
    staleProcessing,
    complianceRisks,
    automationOpen,
    alertsUnread,
  ] = await Promise.all([
    admin.from("erp_infrastructure_jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("updated_at", since24h),
    admin
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing")
      .not("locked_at", "is", null)
      .lt("locked_at", staleBefore),
    admin
      .from("erp_compliance_risk_signals")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("erp_automation_workflow_runs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "running", "waiting_approval"]),
    admin
      .from("governance_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
  ]);

  const errs = [
    pendingJobs.error,
    failedJobs24h.error,
    staleProcessing.error,
    complianceRisks.error,
    automationOpen.error,
    alertsUnread.error,
  ].filter(Boolean);
  if (errs.length) throw new Error(errs.map((e) => e?.message).join("; "));

  const pending = pendingJobs.count ?? 0;
  const failed = failedJobs24h.count ?? 0;
  const staleProc = staleProcessing.count ?? 0;
  const risks = complianceRisks.count ?? 0;
  const runs = automationOpen.count ?? 0;
  const unreadAlerts = alertsUnread.count ?? 0;

  let score = 100;
  score -= Math.min(28, pending * 2);
  score -= Math.min(24, failed * 6);
  score -= Math.min(18, staleProc * 6);
  score -= Math.min(14, risks * 4);
  score -= Math.min(10, runs * 2);
  score -= Math.min(12, unreadAlerts * 3);
  const healthScore = Math.max(0, Math.round(score));

  const breakdown = {
    infra_pending_jobs: pending,
    infra_failed_jobs_24h: failed,
    infra_stale_processing: staleProc,
    compliance_open_risks: risks,
    automation_open_runs: runs,
    governance_unread_alerts: unreadAlerts,
  };

  const projectedBacklog = Math.round(pending * 1.08 + staleProc * 2);
  const predictiveHint = {
    horizon_hours: 24,
    projected_queue_pressure: projectedBacklog,
    model: "heuristic_v1",
  };

  const { error: snapErr } = await admin.from("erp_observability_health_snapshots").insert({
    scope_key: "global",
    health_score: healthScore,
    signal_breakdown: breakdown as Json,
    predictive_hint: predictiveHint as Json,
  });
  if (snapErr) throw new Error(snapErr.message);

  if (pending > 40) {
    await insertAnomalyOpen(admin, {
      rule_key: "infra.queue_backlog_pressure",
      domain_key: "infrastructure",
      severity: pending > 80 ? "high" : "medium",
      anomaly_score: Math.min(100, pending),
      metadata: { pending_jobs: pending } as Json,
    });
  }

  if (failed > 4) {
    await insertAnomalyOpen(admin, {
      rule_key: "infra.failed_job_surge",
      domain_key: "infrastructure",
      severity: failed > 12 ? "high" : "medium",
      anomaly_score: Math.min(100, failed * 8),
      metadata: { failed_jobs_24h: failed } as Json,
    });
  }

  if (staleProc > 2) {
    await insertAnomalyOpen(admin, {
      rule_key: "infra.worker_stall_suspected",
      domain_key: "infrastructure",
      severity: "high",
      anomaly_score: Math.min(100, staleProc * 15),
      metadata: { stale_processing: staleProc, stale_after_minutes: STALE_MINUTES } as Json,
    });
  }

  const { error: predErr } = await admin.from("erp_observability_predictions").insert({
    prediction_key: "queue_pressure_linear_v1",
    horizon_hours: 24,
    scope_key: "global",
    projected_risk: Math.max(0, 100 - healthScore),
    rationale: {
      drivers: breakdown,
      note: "Projection heuristique — brancher modèle ML sans changer le pipeline append-only.",
    } as Json,
  });
  if (predErr) throw new Error(predErr.message);

  const hourBucket = new Date().toISOString().slice(0, 13);
  const incidentKey = `corr:global:${hourBucket}`;

  if (pending > 30 && risks > 0) {
    const { data: existing } = await admin
      .from("erp_observability_incidents")
      .select("id")
      .eq("incident_key", incidentKey)
      .maybeSingle();

    if (!existing?.id) {
      const correlated_refs: Json = [
        { kind: "infrastructure", signal: "pending_jobs", value: pending },
        { kind: "compliance", signal: "open_risk_signals", value: risks },
      ];
      const { data: incRow, error: incErr } = await admin
        .from("erp_observability_incidents")
        .insert({
          incident_key: incidentKey,
          title: "Corrélation file infrastructure et risques conformité",
          severity: risks > 3 || pending > 60 ? "high" : "medium",
          status: "open",
          correlated_refs,
          metadata: { automated: true } as Json,
        })
        .select("id")
        .maybeSingle();
      if (incErr) throw new Error(incErr.message);

      if (incRow?.id) {
        const { error: corrErr } = await admin.from("erp_observability_correlations").insert([
          {
            incident_id: incRow.id,
            source_kind: "infra_pending_jobs",
            source_id: String(pending),
            weight: Math.min(10, pending / 10),
            metadata: {} as Json,
          },
          {
            incident_id: incRow.id,
            source_kind: "compliance_open_risks",
            source_id: String(risks),
            weight: Math.min(10, risks * 2),
            metadata: {} as Json,
          },
        ]);
        if (corrErr && corrErr.code !== "23505") throw new Error(corrErr.message);
      }
    }
  }

  const { error: traceErr } = await admin.from("erp_observability_trace_events").insert({
    trace_id: traceId,
    parent_span_id: null,
    domain_key: "observability",
    operation_key: "observability.health_digest",
    duration_ms: Date.now() - t0,
    payload: { health_score: healthScore, breakdown } as Json,
  });
  if (traceErr) throw new Error(traceErr.message);
}
