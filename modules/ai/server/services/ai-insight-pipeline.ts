import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 10000) / 10000));
}

export async function executeAiInsightPipeline(
  admin: SupabaseClient<Database>,
  _job: InfrastructureJobRow,
): Promise<void> {
  const startedAt = new Date().toISOString();
  const runId = crypto.randomUUID();

  try {
    const [
      healthRowsRes,
      pendingJobs,
      complianceRisks,
      automationOpen,
      obsAnomalies,
    ] = await Promise.all([
      admin
        .from("erp_observability_health_snapshots")
        .select("id,health_score,signal_breakdown,computed_at")
        .eq("scope_key", "global")
        .order("computed_at", { ascending: false })
        .limit(2),
      admin.from("erp_infrastructure_jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("erp_compliance_risk_signals").select("id", { count: "exact", head: true }).eq("status", "open"),
      admin
        .from("erp_automation_workflow_runs")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "running", "waiting_approval"]),
      admin.from("erp_observability_anomalies").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    if (healthRowsRes.error) throw new Error(healthRowsRes.error.message);
    const healthLatestRow = healthRowsRes.data?.[0];
    const healthPrevRow = healthRowsRes.data?.[1];

    const errs = [
      pendingJobs.error,
      complianceRisks.error,
      automationOpen.error,
      obsAnomalies.error,
    ].filter(Boolean);
    if (errs.length) throw new Error(errs.map((e) => e?.message).join("; "));

    const score = healthLatestRow?.health_score ?? null;
    const prevScore = healthPrevRow?.health_score ?? null;
    const pending = pendingJobs.count ?? 0;
    const risks = complianceRisks.count ?? 0;
    const runs = automationOpen.count ?? 0;
    const anomalies = obsAnomalies.count ?? 0;

    const trend =
      score != null && prevScore != null ? score - prevScore : null;

    const signalRefs: Json = [
      { kind: "observability_health", snapshot_id: healthLatestRow?.id ?? null, score },
      { kind: "infra_pending_jobs", value: pending },
      { kind: "compliance_open_risks", value: risks },
      { kind: "automation_open_runs", value: runs },
      { kind: "observability_open_anomalies", value: anomalies },
    ];

    const insights: {
      insight_key: string;
      domain_key: string;
      title: string;
      summary: string;
      confidence: number;
    }[] = [
      {
        insight_key: `global.ops_pulse:${runId}`,
        domain_key: "global",
        title: "Pulsation opérationnelle",
        summary:
          score != null
            ? `Score de santé global ${score}/100. Files en attente : ${pending}, risques conformité ouverts : ${risks}, runs automation ouverts : ${runs}, anomalies observabilité : ${anomalies}.`
            : `Données de santé globale absentes — exécuter un digest observabilité. Files pending : ${pending}, risques : ${risks}.`,
        confidence: score != null ? clampConfidence(0.55 + score / 250) : 0.45,
      },
    ];

    if (trend != null && trend < -5) {
      insights.push({
        insight_key: `risk.health_drift:${runId}`,
        domain_key: "risk",
        title: "Dérive du score de santé",
        summary: `Le score de santé recule de ${Math.abs(trend)} points vs le dernier snapshot — surveiller files et conformité.`,
        confidence: 0.62,
      });
    }

    if (risks > 2) {
      insights.push({
        insight_key: `compliance.exposure:${runId}`,
        domain_key: "finance",
        title: "Charge risque conformité",
        summary: `${risks} signaux conformité ouverts — prioriser revue Finance / journal et contrôles associés.`,
        confidence: clampConfidence(0.5 + Math.min(risks, 10) * 0.04),
      });
    }

    if (pending > 35) {
      insights.push({
        insight_key: `logistics.queue_pressure:${runId}`,
        domain_key: "logistics",
        title: "Pression sur files d’orchestration",
        summary: `${pending} jobs en attente — risque de latence bout-en-bout sur sync domaines et exports.`,
        confidence: clampConfidence(0.52 + Math.min(pending, 80) / 200),
      });
    }

    if (runs > 8) {
      insights.push({
        insight_key: `workflow.automation_load:${runId}`,
        domain_key: "workflow",
        title: "Charge workflows automation",
        summary: `${runs} exécutions automation non terminées — vérifier SLA et escalades.`,
        confidence: 0.58,
      });
    }

    insights.push({
      insight_key: `crm.pipeline_attention:${runId}`,
      domain_key: "crm",
      title: "Pilotage CRM",
      summary:
        "Sur la base des indicateurs transverses : maintenir revue pipeline / opportunités lorsque la santé globale est sous les 75 points.",
      confidence: score != null && score < 75 ? 0.55 : 0.42,
    });

    insights.push({
      insight_key: `rh.capacity_signal:${runId}`,
      domain_key: "rh",
      title: "Signal capacité RH",
      summary:
        "En cas de anomalies observabilité élevées, planifier une revue charge ATS / recrutement et tickets RH liés.",
      confidence: anomalies > 5 ? 0.54 : 0.38,
    });

    for (const ins of insights) {
      const { error } = await admin.from("erp_ai_insights").insert({
        insight_key: ins.insight_key,
        domain_key: ins.domain_key,
        title: ins.title,
        summary: ins.summary,
        confidence: ins.confidence,
        signal_refs: signalRefs,
        pipeline_version: "heuristic_v1",
        metadata: { pipeline_run: runId } as Json,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
    }

    const recs: {
      key: string;
      domain: string;
      title: string;
      hint: string;
      priority: number;
    }[] = [];

    if (pending > 40) {
      recs.push({
        key: `enqueue_obs_digest:${runId}`,
        domain: "global",
        title: "Accélérer traitement files",
        hint: "Enfiler ou exécuter le worker infrastructure ; inspecter jobs bloqués.",
        priority: 9,
      });
    }
    if (risks > 0) {
      recs.push({
        key: `compliance_risk_triage:${runId}`,
        domain: "finance",
        title: "Traiter les risques conformité",
        hint: "Ouvrir Conformité → Risques et lever les blocages journal.",
        priority: 8,
      });
    }
    if (score != null && score < 65) {
      recs.push({
        key: `exec_management_review:${runId}`,
        domain: "global",
        title: "Revue direction",
        hint: "Convocation revue courte : santé & incidents observabilité.",
        priority: 7,
      });
    }

    for (const r of recs) {
      const { error } = await admin.from("erp_ai_recommendations").insert({
        recommendation_key: r.key,
        domain_key: r.domain,
        priority: r.priority,
        title: r.title,
        action_hint: r.hint,
        rationale: { source: "ai.insight_pipeline", run_id: runId } as Json,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (error && error.code !== "23505") throw new Error(error.message);
    }

    const horizon = 14;
    let forecastPoints: { day: number; score: number }[] = [];
    if (score != null && trend != null) {
      const step = trend / 7;
      forecastPoints = Array.from({ length: horizon }, (_, i) => ({
        day: i + 1,
        score: Math.max(0, Math.min(100, Math.round(score + step * (i + 1)))),
      }));
    } else if (score != null) {
      forecastPoints = Array.from({ length: horizon }, (_, i) => ({
        day: i + 1,
        score,
      }));
    }

    if (forecastPoints.length) {
      const { error: fErr } = await admin.from("erp_ai_forecast_artifacts").insert({
        artifact_key: `health_score_forecast:${runId}`,
        domain_key: "global",
        horizon_days: horizon,
        series_key: "observability.health_score",
        forecast_points: forecastPoints as unknown as Json,
        method: "heuristic_linear_local",
        metadata: { baseline_score: score, trend } as Json,
      });
      if (fErr && fErr.code !== "23505") throw new Error(fErr.message);
    }

    const finishedAt = new Date().toISOString();
    const { error: runErr } = await admin.from("erp_ai_pipeline_runs").insert({
      pipeline_key: "ai.insight_pipeline",
      scope_key: "global",
      status: "completed",
      metrics: {
        insights_emitted: insights.length,
        recommendations_emitted: recs.length,
        forecast_emitted: forecastPoints.length > 0,
        started_at: startedAt,
      } as Json,
      started_at: startedAt,
      finished_at: finishedAt,
    });
    if (runErr) throw new Error(runErr.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const finishedAt = new Date().toISOString();
    await admin.from("erp_ai_pipeline_runs").insert({
      pipeline_key: "ai.insight_pipeline",
      scope_key: "global",
      status: "failed",
      metrics: {} as Json,
      error_message: msg.slice(0, 2000),
      started_at: startedAt,
      finished_at: finishedAt,
    });
    throw e;
  }
}
