export type ExecutiveTelemetryEvent = {
  kind: "executive_snapshot_fetch" | "executive_snapshot_partial";
  correlationId?: string;
};

export function emitExecutiveTelemetry(event: ExecutiveTelemetryEvent): void {
  void event;
}
