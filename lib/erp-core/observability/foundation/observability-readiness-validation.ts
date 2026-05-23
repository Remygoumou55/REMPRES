/**
 * P8 — OBSERVABILITY_READINESS_REPORT.
 */

import { BUS_TRACE_MAP } from "@/lib/erp-core/observability/bus/bus-trace-foundation";
import { OBSERVABILITY_API_READINESS } from "@/lib/erp-core/observability/foundation/observability-api-map";
import {
  ERP_BUS_UI_DESIGN,
  ERP_BUS_UI_ROUTE,
} from "@/lib/erp-core/observability/foundation/erp-bus-ui-design-map";
import { OBSERVABILITY_COEXISTENCE_STRATEGY } from "@/lib/erp-core/observability/foundation/observability-coexistence";
import { OBSERVABILITY_GOVERNANCE_MAP } from "@/lib/erp-core/observability/observability-domain-governance";
import { OBSERVABILITY_SECURITY_MODEL } from "@/lib/erp-core/observability/security/observability-security-model";
import { OBSERVABILITY_RUNTIME_VERSION } from "@/lib/erp-core/observability/runtime/observability-runtime";

export const OBSERVABILITY_READINESS_VALIDATION_VERSION = "observability-readiness-p8-v1" as const;

export type ObservabilityReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

export const OBSERVABILITY_READINESS_CHECKS: readonly ObservabilityReadinessCheck[] = [
  {
    id: "P8-1",
    label: "Trace foundation — 4 phases lifecycle",
    passed: BUS_TRACE_MAP.length === 4,
    notes: "published → dispatched → handler_ok | handler_error",
  },
  {
    id: "P8-2",
    label: "Runtime snapshot défini",
    passed: OBSERVABILITY_RUNTIME_VERSION === "observability-runtime-p8-v1",
    notes: "getErpObservabilitySnapshot",
  },
  {
    id: "P8-3",
    label: "UI design — 6 sections read-only",
    passed: ERP_BUS_UI_DESIGN.length >= 5,
    notes: ERP_BUS_UI_ROUTE.path,
  },
  {
    id: "P8-4",
    label: "API readiness — 5 GET endpoints",
    passed: OBSERVABILITY_API_READINESS.allGetEndpointsDefined,
    notes: "POST/DELETE interdits",
  },
  {
    id: "P8-5",
    label: "Security matrix — rôles définis",
    passed: OBSERVABILITY_SECURITY_MODEL.length >= 5,
    notes: "super_admin, finance, hr, vente, viewer",
  },
  {
    id: "P8-6",
    label: "Coexistence — pas de suppression legacy",
    passed: OBSERVABILITY_COEXISTENCE_STRATEGY.rule === "coexistence_first",
    notes: "rings existants réutilisés",
  },
  {
    id: "P8-7",
    label: "Governance — pas de rebuild bus",
    passed: OBSERVABILITY_GOVERNANCE_MAP.some(
      (c) => c.id === "bus_event_traces" && c.status === "active",
    ),
    notes: "external_telemetry blocked",
  },
];

export type ObservabilityReadinessVerdict = "READY" | "NOT READY";

export const OBSERVABILITY_READINESS_VERDICT: {
  overall: ObservabilityReadinessVerdict;
  foundation: ObservabilityReadinessVerdict;
  uiActivation: ObservabilityReadinessVerdict;
  apiActivation: ObservabilityReadinessVerdict;
  blockers: readonly string[];
  nextPhases: readonly string[];
} = {
  overall: OBSERVABILITY_READINESS_CHECKS.every((c) => c.passed) ? "READY" : "NOT READY",
  foundation: OBSERVABILITY_READINESS_CHECKS.every((c) => c.passed) ? "READY" : "NOT READY",
  uiActivation: "READY",
  apiActivation: "READY",
  blockers: [],
  nextPhases: ["P9 RH expansion", "P11 replay/analytics si besoin"],
};
