import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  clearErpEventHandlersForTests,
  listErpEventHandlers,
} from "@/lib/erp-core/events/event-registry";
import {
  matchAutomationRules,
  clearAutomationEngineStateForTests,
} from "@/lib/erp-core/events/automation/automation-rule-engine";
import {
  clearAutomationCooldownForTests,
} from "@/lib/erp-core/events/automation/automation-safety";
import {
  clearAutomationTracesForTests,
  getRecentAutomationTraces,
} from "@/lib/erp-core/events/automation/automation-trace-log";
import { ERP_AUTOMATION_RULES } from "@/lib/erp-core/events/automation/automation-governance";
import { AUTOMATION_READINESS_VERDICT } from "@/lib/erp-core/events/automation/automation-readiness-validation";
import {
  ERP_AUTOMATION_ENGINE_CONSUMER_KEY,
  registerErpAutomationEngineHandler,
} from "@/lib/erp-core/events/handlers/automation-engine-handler";
import {
  resetErpEventHandlersBootstrapForTests,
  ensureErpEventHandlersBootstrapped,
} from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

describe("P6 — Real ERP Automation", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearAutomationTracesForTests();
    clearAutomationCooldownForTests();
    clearAutomationEngineStateForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("ERP_AUTOMATION_RULES — 5 règles actives (P6 + P7.3 HR)", () => {
    const active = ERP_AUTOMATION_RULES.filter((r) => r.status === "active");
    expect(active).toHaveLength(5);
  });

  it("matchAutomationRules — finance threshold", () => {
    const rules = matchAutomationRules({
      id: "e1",
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: null,
      departmentKey: "FINANCE",
      entityType: "finance_threshold",
      entityId: "daily_cfo",
      payload: { threshold_key: "daily_cfo", threshold_gnf: 1e6, actual_gnf: 1.5e6 },
      correlationId: "daily_cfo",
      causationId: null,
    });
    expect(rules).toHaveLength(1);
    expect(rules[0]?.actionKey).toBe("automation.finance.threshold_notify");
  });

  it("engine handler — trace sur crm.quote.converted", async () => {
    registerErpAutomationEngineHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
      actorUserId: "u1",
      departmentKey: "VENTE",
      entityType: "crm_quote",
      entityId: "q-1",
      payload: { sale_id: "s-1", sale_reference: "VTE-001" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const traces = getRecentAutomationTraces(5);
    expect(traces.some((t) => t.ruleKey === "crm.quote.converted.sales_candidate")).toBe(true);
    expect(traces.find((t) => t.ruleKey === "crm.quote.converted.sales_candidate")?.outcome).toBe(
      "executed",
    );
  });

  it("engine handler — approval post candidate", async () => {
    registerErpAutomationEngineHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
      actorUserId: "sa-1",
      departmentKey: "FINANCE",
      entityType: "approval_requests",
      entityId: "req-1",
      payload: { mutationAction: "finance.journal.post" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const traces = getRecentAutomationTraces(3);
    expect(traces.some((t) => t.actionKey === "automation.approval.post_approved_candidate")).toBe(
      true,
    );
  });

  it("cooldown — deuxième exécution skipped", async () => {
    registerErpAutomationEngineHandler();

    const event = {
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
      actorUserId: "fin-cooldown",
      departmentKey: "FINANCE",
      entityType: "finance_threshold",
      entityId: "cooldown-test",
      payload: { threshold_key: "t", threshold_gnf: 100, actual_gnf: 200 },
      persistAudit: false,
      awaitDispatch: true,
    };

    await publishErpEvent(event);
    await publishErpEvent(event);

    const skipped = getRecentAutomationTraces(10).filter((t) => t.outcome === "skipped_cooldown");
    expect(skipped.length).toBeGreaterThanOrEqual(1);
  });

  it("bootstrap — enregistre erp-automation-engine", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
      actorUserId: "u",
      departmentKey: "VENTE",
      entityType: "crm_leads",
      entityId: "l1",
      payload: {},
      persistAudit: false,
      awaitDispatch: true,
    });

    expect(
      listErpEventHandlers().some((h) => h.consumerKey === ERP_AUTOMATION_ENGINE_CONSUMER_KEY),
    ).toBe(true);

    const traces = getRecentEventTraces(20);
    expect(traces.some((t) => t.consumerKey === ERP_AUTOMATION_ENGINE_CONSUMER_KEY)).toBe(true);
  });

  it("bootstrap idempotent", () => {
    ensureErpEventHandlersBootstrapped();
    ensureErpEventHandlersBootstrapped();
    expect(
      listErpEventHandlers().filter((h) => h.consumerKey === ERP_AUTOMATION_ENGINE_CONSUMER_KEY),
    ).toHaveLength(1);
  });

  it("readiness P6 — READY", () => {
    expect(AUTOMATION_READINESS_VERDICT.p6AutomationReady).toBe(true);
  });
});
