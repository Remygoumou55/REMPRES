import type { Database } from "@/types/database.types";

export type ObservabilityHealthSnapshotRow =
  Database["public"]["Tables"]["erp_observability_health_snapshots"]["Row"];
export type ObservabilityIncidentRow =
  Database["public"]["Tables"]["erp_observability_incidents"]["Row"];
export type ObservabilityAnomalyRow =
  Database["public"]["Tables"]["erp_observability_anomalies"]["Row"];
export type ObservabilityTraceEventRow =
  Database["public"]["Tables"]["erp_observability_trace_events"]["Row"];
export type ObservabilityCorrelationRow =
  Database["public"]["Tables"]["erp_observability_correlations"]["Row"];
export type ObservabilityPredictionRow =
  Database["public"]["Tables"]["erp_observability_predictions"]["Row"];
