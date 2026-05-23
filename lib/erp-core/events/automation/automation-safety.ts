/**
 * P6 — Safety framework automation (cooldown, loop guard, retry).
 */

export const ERP_AUTOMATION_SAFETY_VERSION = "erp-automation-safety-p6-v1" as const;

export const ERP_AUTOMATION_SAFETY_POLICY = {
  retryPolicy: "none" as const,
  maxExecutionsPerEvent: 3,
  loopGuard: "forbid_publish_from_automation_handler" as const,
  defaultCooldownMs: 60_000,
  approvalBoundary: "automation_never_bypasses_assertErpMutationApprovalGate",
  observability: "automation-trace-log ring + event trace handler_ok",
} as const;

const cooldownUntil = new Map<string, number>();

export function automationCooldownKey(ruleKey: string, entityId: string | null): string {
  return `${ruleKey}:${entityId ?? "global"}`;
}

export function isAutomationCooldownActive(ruleKey: string, entityId: string | null): boolean {
  const key = automationCooldownKey(ruleKey, entityId);
  const until = cooldownUntil.get(key);
  if (until == null) return false;
  return Date.now() < until;
}

export function markAutomationCooldown(
  ruleKey: string,
  entityId: string | null,
  cooldownMs: number,
): void {
  const key = automationCooldownKey(ruleKey, entityId);
  cooldownUntil.set(key, Date.now() + cooldownMs);
}

export function clearAutomationCooldownForTests(): void {
  cooldownUntil.clear();
}

export function assertAutomationMayRun(input: {
  ruleKey: string;
  entityId: string | null;
  cooldownMs: number;
  executionsForEvent: number;
}): void {
  if (input.executionsForEvent >= ERP_AUTOMATION_SAFETY_POLICY.maxExecutionsPerEvent) {
    throw new Error(`automation:max_executions:${input.ruleKey}`);
  }
  if (isAutomationCooldownActive(input.ruleKey, input.entityId)) {
    throw new Error(`automation:cooldown:${input.ruleKey}`);
  }
}
