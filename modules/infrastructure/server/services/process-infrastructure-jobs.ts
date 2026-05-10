import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { refreshRhDeptKpisDigestAndRevalidate } from "@/modules/analytics/server/services/rh-digest-refresh-service";
import { INFRASTRUCTURE_CACHE_TAGS } from "@/modules/infrastructure/constants/cache-tags";
import { INFRA_JOB_TYPES } from "@/modules/infrastructure/constants/job-types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { dispatchAiInfrastructureJob } from "@/modules/ai/server/services/ai-infra-dispatcher";
import { dispatchAutomationInfrastructureJob } from "@/modules/automation/server/services/automation-infra-dispatcher";
import { dispatchCloudInfrastructureJob } from "@/modules/cloud/server/services/cloud-infra-dispatcher";
import { dispatchComplianceInfrastructureJob } from "@/modules/compliance/server/services/compliance-infra-dispatcher";
import { dispatchEcosystemInfrastructureJob } from "@/modules/ecosystem/server/services/ecosystem-infra-dispatcher";
import { dispatchGovernancePlatformInfrastructureJob } from "@/modules/governance-platform/server/services/governance-platform-infra-dispatcher";
import { dispatchMultitenantInfrastructureJob } from "@/modules/multitenant/server/services/multitenant-infra-dispatcher";
import { dispatchObservabilityInfrastructureJob } from "@/modules/observability/server/services/observability-infra-dispatcher";
import { dispatchPlatformInfrastructureJob } from "@/modules/platform/server/services/platform-infra-dispatcher";
import { dispatchResilienceInfrastructureJob } from "@/modules/resilience/server/services/resilience-infra-dispatcher";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import type { Database } from "@/types/database.types";
import {
  claimInfrastructureJobsAdmin,
  completeInfrastructureJobAdmin,
  rescheduleOrFailInfrastructureJobAdmin,
} from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

async function dispatchInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  if (job.queue_key === INFRA_QUEUE_KEYS.automation || job.job_type.startsWith("automation.")) {
    await dispatchAutomationInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.compliance || job.job_type.startsWith("compliance.")) {
    await dispatchComplianceInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.observability || job.job_type.startsWith("observability.")) {
    await dispatchObservabilityInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.ai || job.job_type.startsWith("ai.")) {
    await dispatchAiInfrastructureJob(admin, job);
    return;
  }

  if (
    job.queue_key === INFRA_QUEUE_KEYS.multitenant ||
    job.job_type.startsWith("multitenant.")
  ) {
    await dispatchMultitenantInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.platform || job.job_type.startsWith("platform.")) {
    await dispatchPlatformInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.ecosystem || job.job_type.startsWith("ecosystem.")) {
    await dispatchEcosystemInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.cloud || job.job_type.startsWith("cloud.")) {
    await dispatchCloudInfrastructureJob(admin, job);
    return;
  }

  if (
    job.queue_key === INFRA_QUEUE_KEYS.governancePlatform ||
    job.job_type.startsWith("governance_platform.")
  ) {
    await dispatchGovernancePlatformInfrastructureJob(admin, job);
    return;
  }

  if (job.queue_key === INFRA_QUEUE_KEYS.resilience || job.job_type.startsWith("resilience.")) {
    await dispatchResilienceInfrastructureJob(admin, job);
    return;
  }

  switch (job.job_type) {
    case INFRA_JOB_TYPES.analyticsRhDigestRefresh: {
      const r = await refreshRhDeptKpisDigestAndRevalidate();
      if (!r.ok) throw new Error(r.message);
      return;
    }
    case INFRA_JOB_TYPES.noopHealthCheck:
      return;
    case INFRA_JOB_TYPES.exportGeneric:
      return;
    default:
      infraLogInfo("infra.job.skip_unknown_type", { jobType: job.job_type, id: job.id });
  }
}

export type ProcessInfrastructureJobsResult = {
  claimed: number;
  completed: number;
  failedRetry: number;
  terminalFailed: number;
};

export async function processPendingInfrastructureJobs(
  batchLimit = 12,
): Promise<ProcessInfrastructureJobsResult> {
  const admin = getSupabaseAdminClient();
  const claimed = await claimInfrastructureJobsAdmin(admin, batchLimit);

  let completed = 0;
  let failedRetry = 0;
  let terminalFailed = 0;

  for (const job of claimed) {
    try {
      await dispatchInfrastructureJob(admin, job);
      await completeInfrastructureJobAdmin(admin, job.id);
      completed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const terminal = job.attempts >= job.max_attempts;
      await rescheduleOrFailInfrastructureJobAdmin(admin, job, msg);
      if (terminal) terminalFailed += 1;
      else failedRetry += 1;
    }
  }

  try {
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.jobsOverview);
    revalidateTag(INFRASTRUCTURE_CACHE_TAGS.analyticsOrchestration);
  } catch {
    /* boundary Next */
  }

  return {
    claimed: claimed.length,
    completed,
    failedRetry,
    terminalFailed,
  };
}
