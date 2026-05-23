/**
 * B3.2+ — Standard consommateurs bus (gouvernance, in-process).
 */

import type { ErpEventEnvelope, ErpEventHandler } from "@/lib/erp-core/events/event-contracts";
import type { ErpEventSensitivity } from "@/lib/erp-core/events/event-contracts";

export const ERP_HANDLER_GOVERNANCE_VERSION = "erp-handler-governance-b3.2-plus-v1" as const;

/** 1 handler = 1 responsabilité métier (notification, automation, trace, refresh…). */
export type ErpHandlerResponsibility =
  | "notification"
  | "automation"
  | "audit_bridge"
  | "cockpit_refresh"
  | "trace_only"
  | "custom";

export type ErpHandlerGovernanceRegistration = {
  pattern: string;
  consumerKey: string;
  responsibility: ErpHandlerResponsibility;
  departmentScope?: string | null;
  maxSensitivity?: ErpEventSensitivity;
  /** Handler ne doit pas relancer publish du même type (anti-boucle). */
  idempotent?: boolean;
  handler: ErpEventHandler;
};

/**
 * Règles officielles (non distribuées) :
 * - retry : 0 en B3.2+ (échec → trace handler_error ; retry = phase ultérieure)
 * - isolation : try/catch par handler dans dispatcher (existant)
 * - safety : pas de publish depuis handler sans passer par publisher officiel
 * - observability : consumerKey + responsibility dans traces futures
 */
export const ERP_HANDLER_GOVERNANCE_RULES = {
  maxHandlersPerPattern: 8,
  allowWildcardPatterns: true,
  defaultMaxSensitivity: "restricted" as ErpEventSensitivity,
  retryPolicy: "none" as const,
  loopGuard: "forbid_republish_same_type_in_handler" as const,
} as const;

export type ErpHandlerDispatchOutcome = {
  eventId: string;
  consumerKey: string;
  ok: boolean;
  errorMessage?: string;
};

export type ErpHandlerLifecycleHooks = {
  onRegister?: (consumerKey: string) => void;
  onDispatchStart?: (event: ErpEventEnvelope) => void;
  onDispatchEnd?: (outcomes: ErpHandlerDispatchOutcome[]) => void;
};
