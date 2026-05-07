import { createGovernanceAlert } from "@/lib/governance/alerts/repository";
import type { GovernanceAlertSeverity } from "@/lib/governance/alerts/types";

export async function createAlert(input: {
  type: string;
  severity: GovernanceAlertSeverity;
  departmentKey?: string | null;
  title: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  triggeredBy?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createGovernanceAlert({
    type: input.type,
    severity: input.severity,
    departmentKey: input.departmentKey ?? null,
    title: input.title,
    description: input.description,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    triggeredBy: input.triggeredBy ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function tryCreateAlert(input: {
  type: string;
  severity: GovernanceAlertSeverity;
  departmentKey?: string | null;
  title: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  triggeredBy?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAlert(input);
  } catch {
    // no-op: alerting must never break operational flow
  }
}
