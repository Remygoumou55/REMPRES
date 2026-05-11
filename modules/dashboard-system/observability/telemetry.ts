export type DashboardTelemetryEvent = {
  kind: "dashboard_foundation_fetch" | "dashboard_foundation_merge" | "dashboard_foundation_error";
  correlationId?: string;
  detail?: Record<string, unknown>;
};

/** Point d’accroche observability — brancher ici APM / logs structurés sans coupler le module à un fournisseur. */
export function emitDashboardTelemetry(event: DashboardTelemetryEvent): void {
  void event;
}
