import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";
import type { ProcessInfrastructureJobsResult } from "@/modules/infrastructure/server/services/process-infrastructure-jobs";

/** Observabilité légère batch jobs — brancher Datadog/Sentry via wrappers métier au besoin. */
export function emitInfrastructureJobBatchMetrics(summary: ProcessInfrastructureJobsResult): void {
  infraLogInfo("infra.jobs.batch_summary", {
    claimed: summary.claimed,
    completed: summary.completed,
    failedRetry: summary.failedRetry,
    terminalFailed: summary.terminalFailed,
  });
}
