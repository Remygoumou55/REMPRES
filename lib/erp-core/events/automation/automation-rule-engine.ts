/**
 * P6 — Moteur automation ERP : event → match → evaluate → handler → action.
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type {
  ErpAutomationExecutionContext,
  ErpAutomationRule,
} from "@/lib/erp-core/events/foundation/automation-foundation";
import { ERP_AUTOMATION_RULES, AUTOMATION_GOVERNANCE_MAP } from "@/lib/erp-core/events/automation/automation-governance";
import { AUTOMATION_ACTION_HANDLERS } from "@/lib/erp-core/events/automation/automation-action-handlers";
import {
  assertAutomationMayRun,
  markAutomationCooldown,
} from "@/lib/erp-core/events/automation/automation-safety";
import { appendAutomationTrace } from "@/lib/erp-core/events/automation/automation-trace-log";

export const ERP_AUTOMATION_ENGINE_VERSION = "erp-automation-engine-p6-v1" as const;

function matchPattern(pattern: string, eventType: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return eventType === prefix || eventType.startsWith(`${prefix}.`);
  }
  return pattern === eventType;
}

function matchPayload(rule: ErpAutomationRule, event: ErpEventEnvelope): boolean {
  if (!rule.payloadMatch || Object.keys(rule.payloadMatch).length === 0) return true;
  for (const [key, expected] of Object.entries(rule.payloadMatch)) {
    if (event.payload[key] !== expected) return false;
  }
  return true;
}

function resolveCooldownMs(ruleKey: string): number {
  const gov = AUTOMATION_GOVERNANCE_MAP.find((g) => g.ruleKey === ruleKey);
  return gov?.cooldownMs ?? 60_000;
}

function resolveGovernanceBlocked(ruleKey: string): boolean {
  const gov = AUTOMATION_GOVERNANCE_MAP.find((g) => g.ruleKey === ruleKey);
  return gov?.status === "blocked" || gov?.runtimeScope === "write_forbidden";
}

export function matchAutomationRules(event: ErpEventEnvelope): ErpAutomationRule[] {
  return ERP_AUTOMATION_RULES.filter((rule) => {
    if (rule.status !== "active") return false;
    if (resolveGovernanceBlocked(rule.key)) return false;
    if (!matchPattern(rule.eventPattern, event.type)) return false;
    if (rule.departmentScope && event.departmentKey !== rule.departmentScope) return false;
    return matchPayload(rule, event);
  }).sort((a, b) => {
    const pa = AUTOMATION_GOVERNANCE_MAP.find((g) => g.ruleKey === a.key)?.priority ?? 0;
    const pb = AUTOMATION_GOVERNANCE_MAP.find((g) => g.ruleKey === b.key)?.priority ?? 0;
    return pa - pb;
  });
}

const executionsPerEvent = new Map<string, number>();

function eventExecutionKey(eventId: string, ruleKey: string): string {
  return `${eventId}:${ruleKey}`;
}

export async function executeAutomationRule(
  rule: ErpAutomationRule,
  event: ErpEventEnvelope,
): Promise<void> {
  const handler = AUTOMATION_ACTION_HANDLERS[rule.actionKey];
  if (!handler) {
    appendAutomationTrace({
      ruleKey: rule.key,
      actionKey: rule.actionKey,
      eventId: event.id,
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: "error",
      detail: `unknown_action:${rule.actionKey}`,
    });
    return;
  }

  const cooldownMs = resolveCooldownMs(rule.key);
  const execKey = eventExecutionKey(event.id, rule.key);
  const execCount = executionsPerEvent.get(execKey) ?? 0;

  try {
    assertAutomationMayRun({
      ruleKey: rule.key,
      entityId: event.entityId,
      cooldownMs,
      executionsForEvent: execCount,
    });
  } catch (e) {
    appendAutomationTrace({
      ruleKey: rule.key,
      actionKey: rule.actionKey,
      eventId: event.id,
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: "skipped_cooldown",
      detail: e instanceof Error ? e.message : String(e),
    });
    return;
  }

  const ctx: ErpAutomationExecutionContext = {
    rule,
    event,
    triggeredAt: new Date().toISOString(),
  };

  try {
    await handler(ctx);
    markAutomationCooldown(rule.key, event.entityId, cooldownMs);
    executionsPerEvent.set(execKey, execCount + 1);
  } catch (e) {
    appendAutomationTrace({
      ruleKey: rule.key,
      actionKey: rule.actionKey,
      eventId: event.id,
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: "error",
      detail: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function runAutomationEngineForEvent(event: ErpEventEnvelope): Promise<void> {
  const rules = matchAutomationRules(event);
  for (const rule of rules) {
    await executeAutomationRule(rule, event);
  }
}

export function clearAutomationEngineStateForTests(): void {
  executionsPerEvent.clear();
}
