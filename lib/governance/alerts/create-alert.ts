import { emitGovernanceAlert, tryEmitGovernanceAlert } from "@/lib/governance/alert-engine";
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
  await emitGovernanceAlert({
    type: input.type,
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
  await tryEmitGovernanceAlert({
    type: input.type,
    departmentKey: input.departmentKey ?? null,
    title: input.title,
    description: input.description,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    triggeredBy: input.triggeredBy ?? null,
    metadata: input.metadata ?? {},
  });
}
