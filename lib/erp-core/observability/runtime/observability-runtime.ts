/**
 * P8 — OBSERVABILITY_RUNTIME — getErpObservabilitySnapshot (read-only).
 */

import { ensureErpEventHandlersBootstrapped } from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { ERP_EVENT_HANDLERS_BOOTSTRAP_VERSION } from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { listErpEventHandlers } from "@/lib/erp-core/events/event-registry";
import {
  ERP_EVENT_CATALOG_VERSION,
  ERP_EVENT_GOVERNANCE_MAP,
} from "@/lib/erp-core/events/governance/event-catalog-governance";
import { getRecentNotificationBridgeLogs } from "@/lib/erp-core/events/handlers/notification-bridge-log";
import { getRecentAutomationTraces } from "@/lib/erp-core/events/automation/automation-trace-log";
import { ERP_EVENT_BUS_VERSION } from "@/lib/erp-core/events/version";
import {
  readBusTraceFailures,
  readRecentBusTraces,
} from "@/lib/erp-core/observability/bus/bus-trace-read";
import { BUS_TRACE_FOUNDATION } from "@/lib/erp-core/observability/bus/bus-trace-foundation";
import { filterByObservabilityScope } from "@/lib/erp-core/observability/security/observability-security-model";
import type { ObservabilityVisibilityScope } from "@/lib/erp-core/observability/security/observability-security-model";

export const OBSERVABILITY_RUNTIME_VERSION = "observability-runtime-p8-v1" as const;

export type ErpObservabilitySnapshot = {
  version: typeof OBSERVABILITY_RUNTIME_VERSION;
  generatedAt: string;
  visibility: {
    roleClass: string;
    mode: string;
    allowedPrefixes: readonly string[] | null;
  };
  bus: {
    busVersion: string;
    traceFoundation: string;
    catalogVersion: string;
    officialEventCount: number;
  };
  handlers: {
    bootstrapVersion: string;
    count: number;
    registrations: readonly {
      id: string;
      consumerKey: string;
      pattern: string;
      departmentScope: string | null;
    }[];
  };
  recentEvents: ReturnType<typeof readRecentBusTraces>;
  recentNotifications: ReturnType<typeof getRecentNotificationBridgeLogs>;
  recentAutomation: ReturnType<typeof getRecentAutomationTraces>;
  failures: ReturnType<typeof readBusTraceFailures>;
  summary: {
    recentEventCount: number;
    handlerCount: number;
    notificationCount: number;
    automationCount: number;
    failureCount: number;
  };
};

export type GetErpObservabilitySnapshotOptions = {
  eventLimit?: number;
  notificationLimit?: number;
  automationLimit?: number;
  failureLimit?: number;
};

export function getErpObservabilitySnapshot(
  scope: ObservabilityVisibilityScope,
  options: GetErpObservabilitySnapshotOptions = {},
): ErpObservabilitySnapshot {
  ensureErpEventHandlersBootstrapped();

  const eventLimit = options.eventLimit ?? 40;
  const notificationLimit = options.notificationLimit ?? 30;
  const automationLimit = options.automationLimit ?? 30;
  const failureLimit = options.failureLimit ?? 20;

  const allEvents = readRecentBusTraces(eventLimit * 2);
  const allNotifications = getRecentNotificationBridgeLogs(notificationLimit * 2);
  const allAutomation = getRecentAutomationTraces(automationLimit * 2);
  const allFailures = readBusTraceFailures(failureLimit * 2);

  const recentEvents = filterByObservabilityScope(
    allEvents.slice(-eventLimit * 2),
    scope,
    "eventType",
  ).slice(-eventLimit);

  const recentNotifications = filterByObservabilityScope(
    allNotifications.map((n) => ({
      entry: n,
      eventType: n.candidate.sourceEventType,
    })),
    scope,
    "eventType",
  )
    .slice(-notificationLimit)
    .map((row) => row.entry);

  const recentAutomation = filterByObservabilityScope(allAutomation, scope, "eventType").slice(
    -automationLimit,
  );

  const failures = filterByObservabilityScope(allFailures, scope, "eventType").slice(-failureLimit);

  const handlers = listErpEventHandlers();

  return {
    version: OBSERVABILITY_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    visibility: {
      roleClass: scope.roleClass,
      mode: scope.mode,
      allowedPrefixes: scope.allowedPrefixes,
    },
    bus: {
      busVersion: ERP_EVENT_BUS_VERSION,
      traceFoundation: BUS_TRACE_FOUNDATION.version,
      catalogVersion: ERP_EVENT_CATALOG_VERSION,
      officialEventCount: ERP_EVENT_GOVERNANCE_MAP.length,
    },
    handlers: {
      bootstrapVersion: ERP_EVENT_HANDLERS_BOOTSTRAP_VERSION,
      count: handlers.length,
      registrations: handlers.map((h) => ({
        id: h.id,
        consumerKey: h.consumerKey,
        pattern: h.pattern,
        departmentScope: h.departmentScope,
      })),
    },
    recentEvents,
    recentNotifications,
    recentAutomation,
    failures,
    summary: {
      recentEventCount: recentEvents.length,
      handlerCount: handlers.length,
      notificationCount: recentNotifications.length,
      automationCount: recentAutomation.length,
      failureCount: failures.length,
    },
  };
}
