import { getAlertDefinition } from "@/lib/governance/alerts/definitions";
import { createGovernanceAlert, findRecentSimilarAlert } from "@/lib/governance/alerts/repository";

type AlertEngineInput = {
  type: string;
  departmentKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  triggeredBy?: string | null;
  metadata?: Record<string, unknown>;
  title?: string;
  description?: string;
};

export async function emitGovernanceAlert(input: AlertEngineInput): Promise<void> {
  const def = getAlertDefinition(input.type);
  const duplicate = await findRecentSimilarAlert({
    type: input.type,
    departmentKey: input.departmentKey ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    lookbackMinutes: 5,
  });
  if (duplicate) return;

  await createGovernanceAlert({
    type: input.type,
    severity: def.severity,
    departmentKey: input.departmentKey ?? null,
    title: input.title ?? def.titleKey,
    description: input.description ?? def.descriptionKey,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    triggeredBy: input.triggeredBy ?? null,
    category: def.category,
    escalation: def.escalation,
    metadata: {
      ...(input.metadata ?? {}),
      title_key: def.titleKey,
      description_key: def.descriptionKey,
      alert_category: def.category,
      escalation: def.escalation,
      lifecycle: "created",
    },
  });
}

export async function tryEmitGovernanceAlert(input: AlertEngineInput): Promise<void> {
  try {
    await emitGovernanceAlert(input);
  } catch {
    // Alerting must not break core workflow.
  }
}
